import { LoginLevel } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';

export const LoginDto = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String(),
});

export function loginRoutes(fastify: FastifyInstance) {
    fastify.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        error.statusCode = 403;
        if (!error.statusCode)
            reply.status(500).send({ error: 'Something went wrong' });
        else
            reply
                .status(error.statusCode)
                .send({ error: 'Invalid credential combination' });
    });

    fastify.post<{ Body: Static<typeof LoginDto> }>(
        '/login',
        {
            schema: {
                body: LoginDto,
            },
        },
        async (request, reply) => {
            const { email, password } = request.body;
            const user = await fastify.prisma.user.findFirst({
                where: { email },
            });
            const isCorrect = await fastify.bcrypt.compare(
                password,
                user?.password || '',
            );
            if (!user || !isCorrect)
                throw Error('Invalid credential combination');
            const authToken = fastify.jwt.sign(
                {
                    id: user.id,
                    loginLevel: user.otpMethod
                        ? LoginLevel.CREDENTIALS
                        : LoginLevel.FULL,
                },
                { expiresIn: '1h', key: fastify.config.SECRET },
            );
            const refreshToken = fastify.jwt.sign(
                { id: user.id },
                { expiresIn: '7d', key: fastify.config.REFRESH_SECRET },
            );
            const newTimestamp = new Date().toISOString();
            await fastify.prisma.user.update({
                where: { id: user.id },
                data: {
                    refreshToken,
                    lastLogin: newTimestamp,
                },
            });
            if (user.otpMethod)
                reply.send({
                    authToken,
                    userId: user.id,
                    message: '2FA required',
                    otpMethod: user.otpMethod,
                });
            else
                return reply.send({
                    authToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        isValidated: user.emailValidated,
                        avatarUrl: user.avatarUrl,
                        name: user.name,
                    },
                });
        },
    );
}
