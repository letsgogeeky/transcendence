import { FastifyInstance } from 'fastify';
import twoFAuthCheck from '../plugins/2fa.js';

export function usersRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);
    fastify.get('/users', async (_request, reply) => {
        const users = await fastify.prisma.user.findMany({
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

        reply.send(users);
    });
}
