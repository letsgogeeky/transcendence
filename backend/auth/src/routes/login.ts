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
            const user = await fastify.prisma.users.findFirst({
                where: { email },
            });
            const isCorrect = await fastify.bcrypt.compare(
                password,
                user?.password || '',
            );
            if (!user || !isCorrect)
                throw Error('Invalid credential combination');
            const authToken = fastify.jwt.sign(
                { id: user.id },
                { expiresIn: '1h', key: fastify.config.SECRET },
            );
            const refreshToken = fastify.jwt.sign(
                { id: user.id },
                { expiresIn: '7d', key: fastify.config.REFRESH_SECRET },
            );
            const newTimestamp = new Date().toISOString();
            await fastify.prisma.users.update({
                where: { id: user.id },
                data: {
                    last_login: newTimestamp,
                },
            });
            return reply.send({
                authToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    isValidated: user.is_validated,
                    avatarUrl: user.avatar_url,
                    name: user.name,
                },
            });
        },
    );
}
