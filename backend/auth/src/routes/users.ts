import { Friends } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import twoFAuthCheck from '../plugins/2fa.js';

export function usersRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);

    fastify.get<{ Querystring: { status: string } }>(
        '/users',
        async (request, reply) => {
            const { status } = request.query;
            const users = await fastify.prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
                where:
                    status === 'online'
                        ? { id: { in: Array.from(fastify.connections.keys()) } }
                        : {},
            });
            reply.send(users);
        },
    );

    fastify.get<{ Querystring: { username: string } }>(
        '/users/search',
        async (request, reply) => {
            const { username } = request.query;
            const users = await fastify.prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
                where: {
                    OR: [
                        {
                            name: {
                                contains: username,
                            },
                        },
                        {
                            email: {
                                contains: username,
                            },
                        },
                    ],
                },
            });
            reply.send(users);
        },
    );

    fastify.get<{ Params: { id: string } }>(
        '/users/:id',
        async (request, reply) => {
            const { id } = request.params;
            const user = await fastify.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    avatarUrl: true,
                },
            });
            if (!user) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            reply.send(user);
        },
    );

    fastify.get('/users-with-relations', async (request, reply) => {
        const friendRequests = await fastify.prisma.friends.findMany({
            where: {
                OR: [{ sender: request.user }, { receiver: request.user }],
            },
        });

        const users = await fastify.prisma.user.findMany({
            where: {
                id: { not: request.user },
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
            },
        });
        const usersWithRelations = users.map((user) => {
            const req = friendRequests.find(
                (req: Friends) =>
                    req.sender == user.id || req.receiver == user.id,
            );
            return {
                user: { ...user, isOnline: fastify.connections.has(user.id) },
                request: req,
            };
        });
        reply.send(usersWithRelations);
    });

    fastify.get<{ Querystring: { username: string } }>(
        '/users-with-relations/search',
        async (request, reply) => {
            const { username } = request.query;
            const friendRequests = await fastify.prisma.friends.findMany({
                where: {
                    OR: [{ sender: request.user }, { receiver: request.user }],
                },
            });

            const users = await fastify.prisma.user.findMany({
                where: {
                    AND: [
                        { id: { not: request.user } },
                        {
                            OR: [
                                {
                                    name: {
                                        contains: username,
                                    },
                                },
                                {
                                    email: {
                                        contains: username,
                                    },
                                },
                            ],
                        },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            });
            const usersWithRelations = users.map((user) => {
                const req = friendRequests.find(
                    (req: Friends) =>
                        req.sender == user.id || req.receiver == user.id,
                );
                return { user, request: req };
            });
            reply.send(usersWithRelations);
        },
    );
}
