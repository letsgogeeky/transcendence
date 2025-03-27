import multipart from '@fastify/multipart';
import { OtpMethod } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import twoFAuthCheck from '../plugins/2fa.js';

export const UpdateUserDto = Type.Object({
    email: Type.Optional(Type.String({ format: 'email' })),
    name: Type.Optional(Type.String()),
    phoneNumber: Type.Optional(Type.String()),
    avatarUrl: Type.Optional(Type.String()),
    otpMethod: Type.Optional(Type.Union([Type.Enum(OtpMethod), Type.Null()])),
});

export const PasswordUpdateDto = Type.Object({
    oldPassword: Type.String(),
    newPassword: Type.String(),
});

export function userRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);
    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (error.code == 'P2002') error.statusCode = 409;
        reply.status(error.statusCode || 500).send({ error: error.message });
    });

    fastify.register(multipart);
    fastify.put<{ Body: Static<typeof UpdateUserDto> }>(
        '/user/avatar',
        async (request, reply) => {
            const data = await request.file();
            if (!data) reply.code(400).send({ error: 'Empty image' });
            const files = fs.readdirSync(fastify.config.UPLOAD_DIR);
            const oldAvatar = files.find(
                (file) =>
                    path.parse(file).name == request.user &&
                    path.extname(data!.filename) != path.extname(file),
            );
            if (oldAvatar)
                fs.unlinkSync(path.join(fastify.config.UPLOAD_DIR, oldAvatar));
            const newAvatar = `${request.user}${path.extname(data!.filename)}`;
            await pipeline(
                data!.file,
                fs.createWriteStream(
                    path.join(fastify.config.UPLOAD_DIR, newAvatar),
                ),
            );
            const user = await fastify.prisma.user.update({
                where: { id: request.user },
                data: {
                    avatarUrl: path.join('images', newAvatar),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    avatarUrl: true,
                    otpMethod: true,
                    emailValidated: true,
                },
            });
            reply.setCookie('userName', user.name, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/socket',
            });
            reply.send(user);
        },
    );

    fastify.put<{ Body: Static<typeof UpdateUserDto> }>(
        '/user/update',
        {
            schema: {
                body: UpdateUserDto,
            },
        },
        async (request, reply) => {
            if (
                request.body.otpMethod === OtpMethod.SMS &&
                !request.body.phoneNumber
            )
                reply.code(400).send({
                    error: 'Cannot set SMS 2FA without phone number.',
                });
            const newData = {
                ...(request.body.name && { name: request.body.name }),
                ...(request.body.phoneNumber && {
                    phoneNumber: request.body.phoneNumber,
                }),
                otpMethod: request.body.otpMethod,
            };
            const existingUser = await fastify.prisma.user.findUnique({
                where: { id: request.user },
                select: { otpMethod: true },
            });
            const usr = await fastify.prisma.user.update({
                where: { id: request.user },
                data: {
                    ...newData,
                    hasQrCode:
                        existingUser?.otpMethod == newData.otpMethod &&
                        existingUser?.otpMethod == OtpMethod.AUTHENTICATOR
                            ? 1
                            : 0,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    avatarUrl: true,
                    otpMethod: true,
                    emailValidated: true,
                },
            });
            reply.send(usr);
        },
    );

    fastify.put<{ Body: Static<typeof PasswordUpdateDto> }>(
        '/user/update-password',
        {
            schema: {
                body: PasswordUpdateDto,
            },
        },
        async (request, reply) => {
            const { oldPassword, newPassword } = request.body;
            const user = await fastify.prisma.user.findFirst({
                where: { id: request.user },
            });
            if (!user) throw Error('User not found');
            const isCorrect = await fastify.bcrypt.compare(
                oldPassword,
                user.password,
            );
            if (!isCorrect) throw Error('Invalid old password');
            if (newPassword.length < 8)
                return reply
                    .code(400)
                    .send({ error: 'New password not strong enough' });
            const hash = await fastify.bcrypt.hash(newPassword);
            const usr = await fastify.prisma.user.update({
                where: { id: request.user },
                data: {
                    password: hash,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    avatarUrl: true,
                    otpMethod: true,
                    emailValidated: true,
                },
            });
            reply.send(usr);
        },
    );
}
