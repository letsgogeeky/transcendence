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
                        { receiver: request.user },
                        { status: FriendRequestStatus.PENDING },
                    ],
                },
                include: {
                    senderUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
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

    function notify(
        fastify: FastifyInstance,
        senderId: string,
        receiverId: string,
        message: string,
    ) {
        const receiverSocket = fastify.connections.get(receiverId);
        const senderSocket = fastify.connections.get(senderId);
        if (receiverSocket) receiverSocket.send(message);
        if (senderSocket) senderSocket.send(message);
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
                type: 'FRIEND_REQUEST',
                message: 'New Friend Request',
                data: friendRequest,
            });

            notify(fastify, senderId, receiverId, message);
            reply.send(friendRequest);
        },
    );

    fastify.put<{ Params: { requestId: string; action: FriendAction } }>(
        '/friend-requests/:requestId/:action',
        async (request, reply) => {
            const { requestId, action } = request.params;
            const friendRequest = await fastify.prisma.friends.findFirst({
                where: {
                    OR: [
                        { id: requestId, receiver: request.user },
                        { id: requestId, sender: request.user },
                    ],
                },
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
            if (action == 'accept') {
                result = await fastify.prisma.friends.update({
                    where: { id: requestId, receiver: request.user },
                    data: { status: FriendRequestStatus.ACCEPTED },
                });
                const message = JSON.stringify({
                    type: 'FRIEND_REQUEST',
                    message: 'Friend Request accepted',
                    data: {
                        ...friendRequest,
                        status: FriendRequestStatus.ACCEPTED,
                    },
                });
                notify(
                    fastify,
                    friendRequest.sender,
                    friendRequest.receiver,
                    message,
                );
            } else if (action == 'delete') {
                const message = JSON.stringify({
                    type: 'FRIEND_REQUEST',
                    message: 'Friend Request deleted',
                    data: { ...friendRequest, status: 'DELETED' },
                });
                reply.send(friendRequest);
                result = await fastify.prisma.friends.deleteMany({
                    where: {
                        OR: [
                            { id: requestId, receiver: request.user },
                            { id: requestId, sender: request.user },
                        ],
                    },
                });
                notify(
                    fastify,
                    friendRequest.sender,
                    friendRequest.receiver,
                    message,
                );
            } else
                return reply.code(400).send({
                    error: 'Bad request. Invalid action',
                });
            reply.send(result);
        },
    );
}
