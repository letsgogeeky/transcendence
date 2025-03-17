// a websocket route for chat

import { FastifyInstance } from "fastify";

interface chatMessage {
    token: string;
    content: string;
    chatRoomId: string;
    userId: string;
}

export function chatRoutes(fastify: FastifyInstance) {
    fastify.route({
        method: 'GET',
        url: '/',
        handler: (request, reply) => {
            reply.send('Chat WebSocket!');
        },
        wsHandler: (socket, req) => {
            console.log('WebSocket Connected!');
            if (!req.user) {
                console.warn(`User not found for socket ${req.socket.remoteAddress}`);
                socket.close();
                return;
            }
            fastify.chatConnections.set(req.user.id, socket);
            socket.on('message', (message) => {
                console.log(message);
                if (typeof message === 'string') {
                    const chatMessage: chatMessage = JSON.parse(message) as chatMessage;
                    fastify.chatConnections.get(chatMessage.userId)?.send(JSON.stringify({
                        type: 'chatMessage',
                        data: chatMessage,
                    }));
                }
                else {
                    console.log(`Received non-string message from ${req.user?.id}`);
                }
            });
            socket.on('close', () => {
                if (!req.user) {
                    console.log(`User not found for socket ${req.socket.remoteAddress}`);
                    socket.close();
                    return;
                }
                fastify.chatConnections.delete(req.user.id);
                console.log(`User ${req.user.id} disconnected`);
                socket.close();
                return;
            });
            socket.on('error', (error) => {
                console.error('WebSocket Error:', error);
            });
            socket.on('open', () => {
                console.log('WebSocket Opened!');
            });
        },
    });
}