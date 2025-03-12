import { LoginLevel } from '@prisma/client';
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

    function notifyEveryone(
        userId: string,
        messageStr: string,
        value: string,
    ): void {
        const message = JSON.stringify({
            type: 'STATUS_CHANGE',
            data: {
                message: messageStr,
                id: userId,
                value,
            },
        });
        fastify.connections.forEach((client, key) => {
            if (client.readyState === client.OPEN && userId != key) {
                client.send(message);
                console.log('message sent to ' + key);
            }
        });
    }

    fastify.route({
        method: 'GET',
        url: '/socket/',
        handler: (req, reply) => {
            reply.send({ message: 'WebSocket endpoint' });
        },
        wsHandler: (socket, req) => {
            const { userId } = req.cookies;
            console.log('WebSocket Connected!');
            socket.on('message', (message: string) => {
                console.log('Received:' + message);
                const data = JSON.parse(message) as SocketData;
                if (data.type == 'AUTH') {
                    const id = verifyToken(data.token);
                    if (id) {
                        fastify.connections.set(id, socket);
                        notifyEveryone(id, 'User is online', 'LOGIN');
                    }
                }
            });
            socket.on('close', () => {
                if (fastify.connections.get(userId!)) {
                    fastify.connections.delete(userId!);
                    notifyEveryone(userId!, 'User logged out', 'LOGOUT');
                }
            });
            socket.on('error', (err) => {
                console.error('WebSocket Error:', err);
            });
        },
    });
}
