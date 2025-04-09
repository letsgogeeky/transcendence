// a websocket route for chat

import { FastifyInstance } from "fastify";
import credentialAuthCheck from "../../plugins/validateToken.js";
interface chatMessage {
    token: string;
    content: string;
    chatRoomId: string;
    userId: string;
}

export function chatRoutes(fastify: FastifyInstance) {
    fastify.register(credentialAuthCheck);
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
            fastify.connections.set(req.user, socket);
            socket.on('message', (message) => {
                console.log(message);
                if (typeof message === 'string') {
                    const chatMessage: chatMessage = JSON.parse(message) as chatMessage;
                    fastify.connections.get(chatMessage.userId)?.send(JSON.stringify({
                        type: 'chatMessage',
                        data: chatMessage,
                    }));
                }
                else {
                    console.log(`Received non-string message from ${req.user}`);
                }
            });
            socket.on('close', () => {
                if (!req.user) {
                    console.log(`User not found for socket ${req.socket.remoteAddress}`);
                    socket.close();
                    return;
                }
                fastify.connections.delete(req.user);
                console.log(`User ${req.user} disconnected`);
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