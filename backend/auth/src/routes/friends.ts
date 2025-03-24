import { FriendRequestStatus } from '@prisma/client';
import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import twoFAuthCheck from '../plugins/2fa.js';

export const newFriendRequst = Type.Object({
    senderId: Type.String(),
    receiverId: Type.String(),
});

export type FriendAction = 'accept' | 'delete';

export function friendRequestsRoutes(fastify: FastifyInstance) {
    fastify.register(twoFAuthCheck);

    fastify.get<{ Querystring: { status: string } }>(
        '/friends',
        async (request, reply) => {
            const friendRequests = await fastify.prisma.friends.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { sender: request.user },
                                { receiver: request.user },
                            ],
                        },
                        { status: FriendRequestStatus.ACCEPTED },
                    ],
                },
            });
            const ids = friendRequests.map((friendReq) =>
                friendReq.receiver == request.user
                    ? friendReq.sender
                    : friendReq.receiver,
            );

            const friends = await fastify.prisma.user.findMany({
                where: { id: { in: ids } },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            });
            reply.send(friends);
        },
    );

    fastify.get<{ Querystring: { status: string } }>(
        '/friend-requests/received',
        async (request, reply) => {
            const friendRequests = await fastify.prisma.friends.findMany({
                where: {
                    AND: [
                        {
                            OR: [{ receiver: request.user }],
                        },
                        { status: FriendRequestStatus.PENDING },
                    ],
                },
            });
            reply.send(friendRequests);
        },
    );

    async function noDuplicate(
        senderId: string,
        receiverId: string,
    ): Promise<boolean> {
        const sameRequest = await fastify.prisma.friends.findFirst({
            where: { AND: [{ sender: senderId }, { receiver: receiverId }] },
        });
        const reverseRequest = await fastify.prisma.friends.findFirst({
            where: { AND: [{ receiver: senderId }, { sender: receiverId }] },
        });
        return !sameRequest && !reverseRequest;
    }

    fastify.post<{ Body: Static<typeof newFriendRequst> }>(
        '/friend-requests',
        {
            schema: {
                body: newFriendRequst,
            },
        },
        async (request, reply) => {
            const { senderId, receiverId } = request.body;
            if (senderId != request.user || senderId == receiverId)
                return reply
                    .code(400)
                    .send({ error: 'Unauthorized to send request.' });
            if (!(await noDuplicate(senderId, receiverId)))
                return reply.code(409).send({
                    error: 'Friend request already exists or has been DELETED.',
                });
            const friendRequest = await fastify.prisma.friends.create({
                data: {
                    sender: senderId,
                    receiver: receiverId,
                    status: FriendRequestStatus.PENDING,
                },
            });
            const message = JSON.stringify({
                type: 'FRIEND_REQUEST_INCOMING',
                data: {
                    message: 'New Friend Request',
                    data: friendRequest,
                },
            });
            const socket = fastify.connections.get(receiverId);
            if (socket) socket.send(message);
            reply.send(friendRequest);
        },
    );

    fastify.put<{ Params: { requestId: string; action: FriendAction } }>(
        '/friend-requests/:requestId/:action',
        async (request, reply) => {
            const { requestId, action } = request.params;
            const friendRequest = await fastify.prisma.friends.findUnique({
                where: { id: requestId, receiver: request.user },
            });
            if (
                !friendRequest ||
                (action == 'accept' &&
                    friendRequest.status == FriendRequestStatus.ACCEPTED)
            )
                return reply.code(400).send({
                    error: 'Unauthorized to take this action on request.',
                });
            let result;
            const socket = fastify.connections.get(friendRequest.receiver);
            if (action == 'accept') {
                result = await fastify.prisma.friends.update({
                    where: { id: requestId, receiver: request.user },
                    data: { status: FriendRequestStatus.ACCEPTED },
                });
                const message = JSON.stringify({
                    type: 'FRIEND_REQUEST_ACCEPTED',
                    data: {
                        message: 'Friend Request acceptrd',
                        data: friendRequest,
                    },
                });
                if (socket) socket.send(message);
            } else if (action == 'delete') {
                const message = JSON.stringify({
                    type: 'FRIEND_REQUEST_DELETED',
                    data: {
                        message: 'Friend Request deleted',
                        data: friendRequest,
                    },
                });
                if (socket) socket.send(message);
                reply.send(friendRequest);

                result = await fastify.prisma.friends.delete({
                    where: { id: requestId, receiver: request.user },
                });
            } else
                return reply.code(400).send({
                    error: 'Bad request. Invalid action',
                });
            reply.send(result);
        },
    );
}
