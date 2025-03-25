import { FriendRequestStatus, LoginLevel } from '@prisma/client';
import { FastifyInstance } from 'fastify';

interface SocketData {
    type: string;
    token?: string;
}

export function SocketRoutes(fastify: FastifyInstance) {
    function verifyToken(token?: string): string | null {
        if (!token) return null;
        let id = null;
        try {
            const decoded = fastify.jwt.verify<{
                id: string;
                loginLevel: LoginLevel;
            }>(token);
            if (decoded.loginLevel == LoginLevel.FULL) id = decoded.id;
        } catch (error) {
            console.error(error);
        }
        return id;
    }

    async function notifyFriends(
        userId: string,
        messageStr: string,
        value: string,
    ): Promise<void> {
        const message = JSON.stringify({
            type: value,
            message: messageStr,
            id: userId,
        });
        console.log('notify friends');
        const friends = await fastify.prisma.friends.findMany({
            where: {
                AND: [
                    {
                        OR: [{ sender: userId }, { receiver: userId }],
                    },
                    { status: FriendRequestStatus.ACCEPTED },
                ],
            },
            select: { sender: true, receiver: true },
        });
        const friendIds = friends.map((friendReq) =>
            friendReq.receiver == userId
                ? friendReq.sender
                : friendReq.receiver,
        );
        for (const [key, client] of fastify.connections.entries()) {
            if (!friendIds.includes(key)) return;
            if (userId != key) {
                client.send(message);
            }
        }
    }

    fastify.route({
        method: 'GET',
        url: '/socket/',
        handler: (req, reply) => {
            reply.send({ message: 'WebSocket endpoint' });
        },
        wsHandler: (socket, req) => {
            const { userId, userName } = req.cookies;
            socket.on('message', (message: string) => {
                console.log('Received:' + message);
                const data = JSON.parse(message) as SocketData;
                if (data.type == 'AUTH') {
                    const id = verifyToken(data.token);
                    if (id) {
                        console.log('id is ' + id);
                        console.log([...fastify.connections.keys()]);
                        if (fastify.connections.has(id)) {
                            const message = { type: 'CONFLICT' };
                            const oldSocket = fastify.connections.get(id);
                            oldSocket!.send(JSON.stringify(message));
                            oldSocket!.close();
                        }
                        fastify.connections.set(id, socket);
                        notifyFriends(
                            id,
                            userName + ' is online',
                            'LOGIN',
                        ).catch((error) => {
                            console.error('Error in notifying friends:', error);
                        });
                    }
                }
            });
            socket.on('close', () => {
                if (fastify.connections.get(userId!)) {
                    fastify.connections.delete(userId!);
                    notifyFriends(
                        userId!,
                        userName + ' is offline',
                        'LOGOUT',
                    ).catch((error) => {
                        console.error('Error in notifying friends:', error);
                    });
                }
            });
            socket.on('error', (err) => {
                console.error('WebSocket Error:', err);
            });
        },
    });
}
