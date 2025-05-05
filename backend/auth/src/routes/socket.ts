import { FriendRequestStatus, LoginLevel } from '@prisma/client';
import {
    ExtendedWebSocket,
    FastifyInstance,
    FastifyReply,
    FastifyRequest,
} from 'fastify';
import { v4 as uuidv4 } from 'uuid';

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
        for (const [key, clients] of fastify.connections.entries()) {
            for (const client of clients) {
                if (!friendIds.includes(key)) return;
                if (userId != key) {
                    client.send(message);
                }
            }
        }
    }

    async function handleAuthMessage(
        socket: ExtendedWebSocket,
        data: SocketData,
    ): Promise<void> {
        let id;
        try {
            id = verifyToken(data.token);
        } catch (e) {
            console.log(e);
            const message = JSON.stringify({
                type: 'EXPIRED',
            });
            socket.send(message);
            return;
        }
        if (id) {
            try {
                const user = await fastify.prisma.user.findUnique({
                    where: { id },
                    select: { name: true },
                });

                if (user) {
                    const message = {
                        type: 'SUCCESS',
                        message: '👋  Welcome ' + user.name,
                    };
                    socket.send(JSON.stringify(message));
                    if (fastify.connections.has(id)) {
                        const sockets = fastify.connections.get(
                            id,
                        ) as ExtendedWebSocket[];
                        const socketids = sockets.map((s) => s.id);
                        console.log(socketids);
                        fastify.connections.set(id, [...sockets, socket]);
                    } else {
                        fastify.connections.set(id, [socket]);
                        notifyFriends(
                            id,
                            user.name + ' is online',
                            'LOGIN',
                        ).catch((error) => {
                            console.error('Error in notifying friends:', error);
                        });
                    }
                    const socketId = uuidv4();
                    socket.id = socketId;
                } else console.log('no user');
            } catch (error) {
                console.error('Error finding user:', error);
                socket.close();
            }
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
        wsHandler: (socket: ExtendedWebSocket, req: FastifyRequest) => {
            const { userId, userName } = req.cookies;
            console.log('Cookie header:', req.headers.cookie);
            console.log('new connection, socket id: ' + socket.id);

            socket.on('message', (message: string) => {
                let data: SocketData;
                try {
                    data = JSON.parse(message) as SocketData;
                } catch (error) {
                    console.error('Error parsing message:', error);
                    socket.close();
                    return;
                }
                if (data.type == 'AUTH') {
                    handleAuthMessage(socket, data).catch((e) => {
                        console.log('Error ' + e);
                    });
                }
            });

            socket.on('close', () => {
                if (userId && fastify.connections.has(userId)) {
                    console.log(
                        'last sockt id was ' + socket.id + 'for user ' + userId,
                    );
                    const userSockets = fastify.connections.get(userId);

                    fastify.connections.set(
                        userId,
                        userSockets!.filter((s) => s.id != socket.id),
                    );
                    if (!fastify.connections.get(userId)!.length) {
                        fastify.connections.delete(userId);
                        notifyFriends(
                            userId,
                            userName + ' is offline',
                            'LOGOUT',
                        ).catch((error) => {
                            console.error('Error in notifying friends:', error);
                        });
                    }
                }
            });

            socket.on('error', (err: Error) => {
                console.error('WebSocket Error:', err);
            });
        },
    });
}
