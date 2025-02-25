import { OtpMethod } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import twoFAuthCheck from '../plugins/2fa.js';

export const UpdateUserDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
    name: Type.String(),
    phoneNumber: Type.Optional(Type.String()),
    avatarUrl: Type.Optional(Type.String()),
    otpMethod: Type.Optional(Type.Union([Type.Enum(OtpMethod), Type.Null()])),
});

export function userRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);
    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (error.code == 'P2002') error.statusCode = 409;
        reply.status(error.statusCode || 500).send({ error: error.message });
    });

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
            const hash = await fastify.bcrypt.hash(request.body.password);
            const usr = await fastify.prisma.user.update({
                where: { id: request.user },
                data: {
                    ...request.body,
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
