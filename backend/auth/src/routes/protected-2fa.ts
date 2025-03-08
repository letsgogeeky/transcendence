import { OtpMethod } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import twoFAuthCheck from '../plugins/2fa.js';

export const OtpVerifyDto = Type.Object({
    token: Type.String(),
});

export const OtpSetup = Type.Object({
    method: Type.Enum(OtpMethod),
    phoneNumber: Type.Optional(Type.String()),
});

export function protectedOtpRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);
    fastify.post<{ Body: Static<typeof OtpSetup> }>(
        '/otp/setup',
        {
            schema: {
                body: OtpSetup,
            },
        },
        async (req, res) => {
            const user = await fastify.prisma.user.findUnique({
                where: { id: req.user },
            });
            if (!user) {
                return res.status(404).send({
                    error: 'No user with that id exists',
                });
            }
            const { phoneNumber, method } = req.body;
            if (method == OtpMethod.SMS) {
                if (!phoneNumber)
                    return res
                        .code(400)
                        .send({ error: 'Phone number missing' });
                await fastify.prisma.user.update({
                    where: { id: req.user },
                    data: {
                        otpMethod: method,
                        phoneNumber: phoneNumber,
                    },
                });
            } else
                await fastify.prisma.user.update({
                    where: { id: req.user },
                    data: {
                        otpMethod: method,
                    },
                });
            res.send({ otpMethod: method });
        },
    );

    fastify.post('/otp/disable', async (req, res) => {
        const user = await fastify.prisma.user.findUnique({
            where: { id: req.user },
        });
        if (!user) {
            return res.status(401).send({
                error: "User doesn't exist",
            });
        }

        const updatedUser = await fastify.prisma.user.update({
            where: { id: req.user },
            data: {
                otpMethod: null,
            },
        });

        res.status(200).send({
            otp_disabled: true,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                otpMethod: updatedUser.otpMethod,
            },
        });
    });
}
