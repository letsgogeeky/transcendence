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

async function getBlockedUsers(blockerId: string, fastify: FastifyInstance) {
    const blockedUsers = await fastify.prisma.blockedUser.findMany({
        where: { blockerId },
        include: { blocked: true }, // Include the details of the blocked users
    });

    return blockedUsers.map((entry) => entry.blocked); // Return an array of blocked user details
}

async function ensureUserExists(idUser: string, fastify: FastifyInstance): Promise<void> {
    const user = await fastify.prisma.user.findUnique({
        where: { id: idUser },
    });

    if (!user) {
        console.log(`Benutzer ${idUser} existiert nicht. Erstelle neuen Benutzer.`);
        await fastify.prisma.user.create({
            data: {
                id: idUser,
            },
        });
    }
}

async function blockUser(blockerId: string, blockedId: string, fastify: FastifyInstance): Promise<void> {
    await ensureUserExists(blockerId, fastify);
    await ensureUserExists(blockedId, fastify);

    try {
        await fastify.prisma.blockedUser.create({
            data: {
                blockerId,
                blockedId,
            },
        });
        console.log(`User ${blockedId} wurde von ${blockerId} blockiert.`);
    } catch (error) {
        console.error('Fehler beim Blockieren des Benutzers:', error);
        throw new Error('Benutzer konnte nicht blockiert werden.');
    }
}

async function unblockUser(blockerId: string, blockedId: string, fastify: FastifyInstance): Promise<void> {
    await ensureUserExists(blockerId, fastify);
    await ensureUserExists(blockedId, fastify);

    try {
        await fastify.prisma.blockedUser.delete({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                },
            },
        });
        console.log(`User ${blockedId} wurde von ${blockerId} entblockt.`);
    } catch (error) {
        console.error('Fehler beim Entblocken des Benutzers:', error);
        throw new Error('Benutzer konnte nicht entblockt werden.');
    }
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
                    if (message instanceof Buffer) {
                        messageString = message.toString('utf8');
                    } else if (message instanceof ArrayBuffer) {
                        messageString = Buffer.from(message).toString('utf8');
                    } else {
                        console.error('Unsupported binary message type:', message);
                        return;
                    }
                } else {
                    if (typeof message === 'string') {
                        messageString = message;
                    } else {
                        console.error('Unsupported non-binary message type:', message);
                        return;
                    }
                }

                try {
                    const chatMessage: chatMessage = JSON.parse(messageString) as chatMessage;
                    console.log('Received message:', chatMessage);

                    // Handle block/unblock message types
                    if (chatMessage.type === 'block') {
                        console.log(`Blocking user llll: ${chatMessage.userId}`);
                        await blockUser(req.user, chatMessage.userId, fastify);
                        fastify.connections.get(req.user)?.send(
                            JSON.stringify({
                                type: 'block',
                                data: `User ${chatMessage.name} has been blocked.`,
                            }),
                        );
                        return;
                    }

                    if (chatMessage.type === 'unblock') {
                        console.log(`Unblocking user: ${chatMessage.userId}`);
                        await unblockUser(req.user, chatMessage.userId, fastify);
                        fastify.connections.get(req.user)?.send(
                            JSON.stringify({
                                type: 'unblock',
                                data: `User ${chatMessage.name} has been unblocked.`,
                            }),
                        );
                        return;
                    }

                    // if (chatMessage.type === 'isBlocked') {
                    //     console.log(`Checking if user ${chatMessage.userId} is blocked by ${req.user}`);
                    //     const blockedUsers = await getBlockedUsers(req.user, fastify);
                    //     // check if userId is in blockedUsers
                    //     const isBlocked = blockedUsers.some((blockedUser) => blockedUser.id === chatMessage.userId);
                    //     console.log('isBlocked:', isBlocked);  
                    //     if (isBlocked) {
                    //         chatMessage.name = 'true';
                    //         chatMessage.content = 'You blocked ', chatMessage.name;
                    //         fastify.connections.get(req.user)?.send(
                    //             JSON.stringify({
                    //                 type: 'isBlocked',
                    //                 data: chatMessage,
                    //             }),
                    //         );
                    //         return;
                    //     } else {
                    //         chatMessage.name = 'false';
                    //         fastify.connections.get(req.user)?.send(
                    //             JSON.stringify({
                    //                 type: 'isBlocked',
                    //                 data: chatMessage,
                    //             }),
                    //         );
                    //         return;
                    //     }
                    // }

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
                            console.log('Fetching chat history');
                            const blockedUsers = await getBlockedUsers(req.user, fastify);
                            const isBlocked = blockedUsers.some((blockedUser) => blockedUser.id === chatMessage.userId);
                            if (isBlocked) {
                                console.log('User is blocked:', chatMessage.userId);
                                chatMessage.name = 'Info';
                                chatMessage.content = 'You blocked this user';
                                // fastify.connections.get(req.user)?.send(
                                //     JSON.stringify({
                                //         type: 'chatMessage',
                                //         // data: 'You blocked this user',
                                //         data: chatMessage,
                                //     }),
                                // );
                                chatMessage.name = 'true';
                                chatMessage.type = 'isBlocked';
                                fastify.connections.get(req.user)?.send(
                                    JSON.stringify({
                                        type: 'isBlocked',
                                        // data: 'You blocked this user',
                                        data: chatMessage,
                                    }),
                                );
                                return;
                            } else {
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
                                fastify.connections.get(req.user)?.send(
                                    JSON.stringify({
                                        type: 'chatHistory',
                                        data: chatRoomMessages,
                                    }),
                                );
                            }
                        }
                    }
                    chatMessage.userId
                    // Check if the user is blocked
                    if (chatMessage.type === 'chatMessage') {
                        const blockedUsers = await getBlockedUsers(chatMessage.userId, fastify);
                        const isBlocked = blockedUsers.some((blockedUser) => blockedUser.id === req.user);
                        if (isBlocked) {
                            console.log('User is blocked:', req.user);
                            chatMessage.name = 'Info';
                            chatMessage.content = 'You are blocked';
                            fastify.connections.get(req.user)?.send(
                                JSON.stringify({
                                    type: 'chatMessage',
                                    // data: 'You are blocked',
                                    data: chatMessage
                                }),
                            );
                            return;
                        }

                        // Store message in db
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

                        fastify.connections.get(chatMessage.userId)?.send(
                            JSON.stringify({
                                type: 'chatMessage',
                                data: chatMessage,
                            }),
                        );
                    }
                    // if (chatMessage.type === 'note') {
                    //     fastify.connections.get(req.user)?.send(
                    //         JSON.stringify({
                    //             type: 'chatMessage',
                    //             data: chatMessage,
                    //         }),
                    //     );
                    // }
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