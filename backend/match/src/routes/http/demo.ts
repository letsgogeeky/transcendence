// demo create the following matches and insert them into the database
// 1. match between user 1 and user 2
// 2. match between user 1, 2, 3


import { FastifyInstance } from "fastify";

export default function demoRoutes(app: FastifyInstance) {
    const user1 = { id: "1", name: "User 1" };
    const user2 = { id: "2", name: "User 2" };
    const user3 = { id: "3", name: "User 3" };
    app.get("/demo", async (request, reply) => {
        const match1 = await app.prisma.match.create({
            data: {
                gameType: "Pong",
                userId: user1.id,
                createdAt: new Date(2024, 1, 1),
                updatedAt: new Date(2024, 1, 1),
            },
        });
        const score1 = await app.prisma.matchScore.create({
            data: {
                matchId: match1.id,
                userId: user1.id,
                score: 10,
            },
        });
        const score2 = await app.prisma.matchScore.create({
            data: {
                matchId: match1.id,
                userId: user2.id,
                score: 10,
            },
        });
        const match2 = await app.prisma.match.create({
            data: {
                gameType: "Pong",
                userId: user1.id,
                participants: {
                    create: [
                        {
                            userId: user1.id,
                        },
                        {
                            userId: user2.id,
                        },
                        {
                            userId: user3.id,
                        },
                    ],
                },
            },
        });
        const score3 = await app.prisma.matchScore.create({
            data: {
                matchId: match2.id,
                userId: user1.id,
                score: 10,
            },
        });
        const score4 = await app.prisma.matchScore.create({
            data: {
                matchId: match2.id,
                userId: user2.id,
                score: 10,
            },
        });
        const score5 = await app.prisma.matchScore.create({
            data: {
                matchId: match2.id,
                userId: user3.id,
                score: 10,
            },
        });
        return reply.status(200).send({
            message: 'Demo matches created',
            match1,
            match2,
            score1,
            score2,
            score3,
            score4,
            score5,
        });
    });
}