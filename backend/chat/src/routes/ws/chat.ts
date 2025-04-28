// a websocket route for chat

import { FastifyInstance } from "fastify";
import credentialAuthCheck from "../../plugins/validateToken.js";
interface chatMessage {
    token: string;
    content: string;
    chatRoomId: string;
    userId: string;
    // name: string;
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
            socket.on('message', (message, isBinary) => {
                let messageString: string;

                if (isBinary || message instanceof Buffer) {
                    // Handle binary messages or Buffers
                    if (message instanceof Buffer) {
                        messageString = message.toString('utf8');
                    } else if (message instanceof ArrayBuffer) {
                        messageString = Buffer.from(message).toString('utf8');
                    } else {
                        console.error('Unsupported binary message type:', message);
                        return;
                    }
                } else {
                    // Handle non-binary messages
                    if (typeof message === 'string') {
                        messageString = message;
                    } else {
                        console.error('Unsupported non-binary message type:', message);
                        return;
                    }
                }

                console.log(messageString);
                try {
                    const chatMessage: chatMessage = JSON.parse(messageString) as chatMessage;
                    console.log('Received message:', chatMessage);
                    // Store message in db
                    fastify.connections.get(chatMessage.userId)?.send(JSON.stringify({
                        type: 'chatMessage',
                        data: chatMessage,
                    }));
                } catch (error) {
                    console.error('Error parsing message:', error);
                    console.error('Received message:', message);
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