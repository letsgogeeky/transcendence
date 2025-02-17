import { FastifyInstance } from 'fastify';

import { Static, Type } from '@sinclair/typebox';

export const User = Type.Object({
    id: Type.Integer(),
    name: Type.String(),
    email: Type.String(),
    password: Type.String(),
    avatar_url: Type.Optional(Type.String()),
    is_validated: Type.Boolean(),
    registration_date: Type.Optional(Type.String()),
    last_login: Type.Optional(Type.String()),
});

export type UserType = Static<typeof User>;

export function usersRoutes(fastify: FastifyInstance) {
    fastify.get('/users', async (_request, reply) => {
        const users = await fastify.prisma.users.findMany();
        reply.send(users);
    });
}
