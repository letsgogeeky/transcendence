// demo create the following chats and insert them into the database
// 1. chat between user 1 and user 2
// 2. chat between user 1 and user 3
// 3. chat between user 2 and user 3
// 4. chat between user 1 and user 4
// 5. chat between user 2 and user 4
// 6. chat between user 3 and user 4
// 7. chat between user 1, 2, 3
// 8. chat between user 1, 2, 4
// 9. chat between user 1, 3, 4
// 10. chat between user 2, 3, 4

import { FastifyInstance } from "fastify";

const user1 = { id: '1', name: 'User 1' };
const user2 = { id: '2', name: 'User 2' };
const user3 = { id: '3', name: 'User 3' };
const user4 = { id: '4', name: 'User 4' };

export default function demoRoutes(fastify: FastifyInstance) {
    fastify.get('/demo', async (request, reply) => {
        const room1 = await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user1.name} and ${user2.name}`,
                createdAt: new Date(2024, 1, 1),
                updatedAt: new Date(2024, 1, 1),
                participants: {
                    create: [
                        {
                            userId: user1.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user2.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        // add 5 messages to the chat
        await fastify.prisma.message.createMany({
            data: [
                {
                    content: 'Hello, how are you?',
                    chatRoomId: room1.id,
                    userId: user1.id,
                    createdAt: new Date(2024, 1, 1),
                    updatedAt: new Date(2024, 1, 1),
                },
                {
                    content: 'I am fine, thank you!',
                    chatRoomId: room1.id,
                    userId: user2.id,
                    createdAt: new Date(2024, 1, 2),
                    updatedAt: new Date(2024, 1, 2),
                },
                {
                    content: 'What is your name?',
                    chatRoomId: room1.id,
                    userId: user1.id,
                    createdAt: new Date(2024, 1, 3),
                    updatedAt: new Date(2024, 1, 3),
                },
                {
                    content: 'My name is User 2',
                    chatRoomId: room1.id,
                    userId: user2.id,
                    createdAt: new Date(2024, 1, 3),
                    updatedAt: new Date(2024, 1, 3),
                },
                {
                    content: 'What is your name?',
                    chatRoomId: room1.id,
                    userId: user1.id,
                    createdAt: new Date(2024, 1, 4),
                    updatedAt: new Date(2024, 1, 4),
                },
                {
                    content: 'My name is User 2',
                    chatRoomId: room1.id,
                    userId: user2.id,
                    createdAt: new Date(2024, 1, 4),
                    updatedAt: new Date(2024, 1, 4),
                },
            ],
        });
        await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user1.name} and ${user3.name}`,
                participants: {
                    create: [
                        {
                            userId: user1.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user3.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user2.name} and ${user3.name}`,
                participants: {
                    create: [
                        {
                            userId: user2.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user3.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user1.name} and ${user4.name}`,
                participants: { 
                    create: [
                        {
                            userId: user1.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user4.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user2.name} and ${user4.name}`,
                participants: {
                    create: [
                        {
                            userId: user2.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user4.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user3.name} and ${user4.name}`,
                participants: {
                    create: [
                        {
                            userId: user3.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user1.name}, ${user2.name}, ${user3.name}`,
                participants: {
                    create: [
                        {
                            userId: user1.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user2.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user3.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user1.name}, ${user2.name}, ${user4.name}`,
                participants: {
                    create: [
                        {
                            userId: user1.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user2.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user4.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user1.name}, ${user3.name}, ${user4.name}`,
                participants: {
                    create: [
                        {
                            userId: user1.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user3.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user4.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        const room6 = await fastify.prisma.chatRoom.create({
            data: {
                name: `Chat between ${user2.name}, ${user3.name}, ${user4.name}`,
                participants: {
                    create: [
                        {
                            userId: user2.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user3.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                        {
                            userId: user4.id,
                            isAdmin: true,
                            joinedAt: new Date(2024, 1, 1),
                        },
                    ],
                },
            },
        });
        // add messages to chat between user 2, user 3 and user 4
        await fastify.prisma.message.createMany({
            data: [
                {
                    content: 'Hello, how are you?',
                    chatRoomId: room6.id,
                    userId: user2.id,
                    createdAt: new Date(2024, 1, 1),
                    updatedAt: new Date(2024, 1, 1),
                },
                {
                    content: 'I am fine, thank you!',
                    chatRoomId: room6.id,
                    userId: user3.id,
                    createdAt: new Date(2024, 1, 2),
                    updatedAt: new Date(2024, 1, 2),
                },
                {
                    content: 'What is your name?',
                    chatRoomId: room6.id,
                    userId: user2.id,
                    createdAt: new Date(2024, 1, 3),
                    updatedAt: new Date(2024, 1, 3),
                },
                {
                    content: 'My name is User 3',
                    chatRoomId: room6.id,
                    userId: user3.id,
                    createdAt: new Date(2024, 1, 3),
                    updatedAt: new Date(2024, 1, 3),
                },
                {
                    content: 'What is your name?',
                    chatRoomId: room6.id,
                    userId: user2.id,
                    createdAt: new Date(2024, 1, 4),
                    updatedAt: new Date(2024, 1, 4),
                },
                {
                    content: 'My name is User 2',
                    chatRoomId: room6.id,
                    userId: user2.id,
                    createdAt: new Date(2024, 1, 4),
                    updatedAt: new Date(2024, 1, 4),
                },
                {
                    content: 'What is your name?',
                    chatRoomId: room6.id,
                    userId: user3.id,
                    createdAt: new Date(2024, 1, 5),
                    updatedAt: new Date(2024, 1, 5),
                },
                {
                    content: 'My name is User 3',
                    chatRoomId: room6.id,
                    userId: user3.id,
                    createdAt: new Date(2024, 1, 5),
                    updatedAt: new Date(2024, 1, 5),
                },
                {
                    content: 'What is your name?',
                    chatRoomId: room6.id,
                    userId: user4.id,
                    createdAt: new Date(2024, 1, 6),
                    updatedAt: new Date(2024, 1, 6),
                },
                {
                    content: 'My name is User 4',
                    chatRoomId: room6.id,
                    userId: user4.id,
                    createdAt: new Date(2024, 1, 6),
                    updatedAt: new Date(2024, 1, 6),
                },
            ],
        });
        reply.send({ message: 'Demo data created' });
    });
    fastify.get('/demo/clear', async (request, reply) => {
        await fastify.prisma.message.deleteMany();
        await fastify.prisma.chatParticipant.deleteMany();
        await fastify.prisma.chatRoom.deleteMany();
        reply.send({ message: 'Demo data cleared' });
    });
}
