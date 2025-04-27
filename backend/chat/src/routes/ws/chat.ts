// a websocket route for chat

import { FastifyInstance } from "fastify";
import credentialAuthCheck from "../../plugins/validateToken.js";
interface chatMessage {
    token: string;
    content: string;
    chatRoomId: string;
    userId: string;
    name: string;
    type: string;
}

function generateChatRoomId(myId: string, chatRoomId: string): string {
    // Compare the IDs and return them in ascending order
    return myId < chatRoomId ? `${myId}-${chatRoomId}` : `${chatRoomId}-${myId}`;
}

export function chatRoutes(fastify: FastifyInstance) {
    fastify.register(credentialAuthCheck);
    fastify.route({
        method: 'GET',
        url: '/',
        handler: (request, reply) => {
            reply.send('Chat WebSocket!');
        },
        wsHandler: async (socket, req) => {
            console.log('WebSocket Connected!');
            if (!req.user) {
                console.warn(`User not found for socket ${req.socket.remoteAddress}`);
                socket.close();
                return;
            }
            fastify.connections.set(req.user, socket);
            socket.on('message', async (message, isBinary) => {
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

                console.log('test', messageString);
                try {
                    const chatMessage: chatMessage = JSON.parse(messageString) as chatMessage;
                    console.log('Received message:', chatMessage);
                    // Store message in db
                    // create a chat room in the db if it doesn't exist
                    const combinedId = generateChatRoomId(req.user, chatMessage.chatRoomId);
                    console.log('combinedId:', combinedId);


                    const chatRoom = await fastify.prisma.chatRoom.findFirst({
                        where: {
                            id: combinedId,
                        },
                    });
                    if (!chatRoom) {
                        console.log('create chatRoom:', combinedId);
                        await fastify.prisma.chatRoom.create({
                            data: {
                                id: combinedId,
                                name: `Chat between ${req.user} and ${chatMessage.userId}`,
                                participants: {
                                    create: [
                                        {
                                            userId: req.user,
                                            isAdmin: true,
                                            joinedAt: new Date(2024, 1, 1),
                                        },
                                        {
                                            userId: chatMessage.userId,
                                            isAdmin: true,
                                            joinedAt: new Date(2024, 1, 1),
                                        },
                                    ],
                                },
                            },
                        });
                    } else {
                        console.log('chatRoom already exists:', combinedId);
                        console.log('chatMessage.type:', chatMessage.type);
                        if (chatMessage.type === 'chatHistory') {
                            console.log('Fetching chat history')
                            const chatRoomMessages = await fastify.prisma.message.findMany({
                                where: {
                                    chatRoomId: combinedId,
                                },
                                select: {
                                    id: true,
                                    content: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    userId: true,
                                    name: true,
                                },
                                orderBy: {
                                    createdAt: 'asc',
                                },
                            });
                            console.log('chatRoomMessages:', chatRoomMessages);
                            fastify.connections.get(req.user)?.send(JSON.stringify({
                                type: 'chatHistory',
                                data: chatRoomMessages,
                            }));
                        }
                        // pull the chat room from the db
                    }
                    // // Store message in db
                    await fastify.prisma.message.createMany({
                        data: [
                            {
                                content: chatMessage.content,
                                chatRoomId: combinedId,
                                userId: req.user,
                                name: chatMessage.name,
                                createdAt: new Date(2024, 1, 1),
                                updatedAt: new Date(2024, 1, 1),
                            },
                        ],
                    });







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