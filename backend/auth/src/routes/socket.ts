import { FriendRequestStatus, LoginLevel } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { FastifyRequest, FastifyReply } from 'fastify';

interface SocketData {
    type: string;
    token?: string;
}

interface FriendRequest {
    sender: string;
    receiver: string;
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
        const friendIds = friends.map((friendReq: FriendRequest) =>
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

    async function handleAuthMessage(socket: WebSocket, data: SocketData): Promise<void> {
        const id = verifyToken(data.token);
        if (id) {
            // if (fastify.connections.has(id)) {
            //     const message = { type: 'CONFLICT' };
            //     const oldSocket = fastify.connections.get(id);
            //     oldSocket!.send(JSON.stringify(message));
            //     oldSocket!.close();
            //     fastify.connections.delete(id);
            //     socket.send(JSON.stringify({ type: 'RETRY' }));
            //     return;
            // }
            fastify.connections.set(id, socket);
            fastify.prisma.user.findUnique({
                where: { id },
                select: { name: true }
            }).then(user => {
                if (user) {
                    const message = {
                        type: 'SUCCESS',
                        message: 'Welcome ' + user.name,
                    };
                    socket.send(JSON.stringify(message));
                    notifyFriends(
                        id,
                        user.name + ' is online',
                        'LOGIN',
                    ).catch((error) => {
                        console.error('Error in notifying friends:', error);
                    });
                }
            }).catch(error => {
                console.error('Error finding user:', error);
                socket.close();
            });
        } else {
            console.log('Invalid token');
            socket.close();
        }
    }

    fastify.route({
        method: 'GET',
        url: '/socket',
        handler: (_req: FastifyRequest, reply: FastifyReply) => {
            reply.send({ message: 'WebSocket endpoint' });
        },
        wsHandler: (socket: WebSocket, _req: FastifyRequest) => {
            console.log('WebSocket connection established');
            socket.on('message', (message: string) => {
                console.log('Received:' + message);
                let data: SocketData;
                try {
                    data = JSON.parse(message) as SocketData;
                } catch (error) {
                    console.error('Error parsing message:', error);
                    socket.close();
                    return;
                }
                if (data.type == 'AUTH') {
                    handleAuthMessage(socket, data);
                }
            });

            socket.on('close', () => {
                console.log('WebSocket connection closed');
                // We don't need to handle cleanup here as the connection is already closed
            });

            socket.on('error', (err: Error) => {
                console.error('WebSocket Error:', err);
            });
        },
    });
}
