import { FastifyInstance } from "fastify";
import credentialAuthCheck from "../../plugins/validateToken.js";
import { GameSettings } from "../ws/session.js";
import { Match } from "@prisma/client";

// List of game modes
// 1. 1v1
// 2. 1vAI
// 3. 2v2
// 4. All vs All

interface PreconfiguredGameSettings {
    mode: string;
}

export function gameHttpRoutes(app: FastifyInstance) {

    async function notifyMatchParticipants(matchId: string) {
        const match = await app.prisma.match.findUnique({
            where: { id: matchId },
            include: {
                participants: true,
            },
        });
        if (!match) {
            return;
        }
         // check if match is full
         if (match.participants.length >= (match.settings as GameSettings).players) {
            // notify all participants in match
            let hasDisconnected = false;
            for (const participant of match.participants) {
                const client = app.connections.get(participant.userId);
                if (!client) {
                    // remove participant from match
                    // await app.prisma.matchParticipant.delete({
                    //     where: { id: participant.id, matchId: match.id },
                    // });
                    hasDisconnected = true;
                }
            }
            if (!hasDisconnected) {
                setTimeout(() => {
                for (const participant of match.participants) {
                    const client = app.connections.get(participant.userId);
                    if (client) {
                        client.send(JSON.stringify({ type: 'MATCH_STARTED', match }));
                    }
                }
            }, 2000);
            }
        }
    }

    async function checkMatch(userId: string) {
        const match = await app.prisma.match.findFirst({
            where: {
                status: { in: ['pending', 'in progress'] },
                participants: {
                    some: { userId: userId },
                },
            },
        });
        if (match) {
            return match;
        }
        return null;
    }
    app.register(credentialAuthCheck);

    app.get('/check-match', async (request, reply) => {
        const match = await checkMatch(request.user);
        if (match) {
            return reply.status(200).send({ message: 'Match found', match });
        }
        return reply.status(404).send({ error: 'No match found' });
    });

    app.post('/create-preconfigured', async (request, reply) => {
        // check if user is already in a match
        const match = await checkMatch(request.user);
        if (match) {
            return reply.status(400).send({ error: 'You are already in a match' });
        }
        try {
            const body = request.body as PreconfiguredGameSettings;
            // get current pending match with same game type
            const match = await app.prisma.match.findFirst({
                where: {
                    gameType: body.mode,
                    status: 'pending',
                },
                include: {
                    participants: true,
                },
            });
            if (match && match.settings) {
                if (match.participants.some(participant => participant.userId === request.user)) {
                    return reply.status(400).send({ error: 'You are already in a match' });
                }
                if (match.participants.length >= (match.settings as GameSettings).players) {
                    return reply.status(400).send({ error: 'Match is full' });
                }
                // add user to match
                await app.prisma.matchParticipant.create({
                    data: {
                        matchId: match.id,
                        userId: request.user,
                        joinedAt: new Date(),
                    },
                });
                await app.prisma.match.update({
                    where: { id: match.id },
                    data: {
                        updatedAt: new Date(),
                    },
                });
                // check if match is full
                await notifyMatchParticipants(match.id);
                return reply.status(200).send({ message: 'Game created successfully', match });
            }
            const settings: GameSettings = {
                players: 0,
                aiPlayers: 0,
                winScore: 0,
                timeLimit: 0,
                replaceDisconnected: false,
                startScore: 0,
                terminatePlayers: false,
                friendlyFire: false,
                kickerMode: false,
                obstacleMode: 0,
                balls: 1,
            };
            if (body.mode === '1v1') {
                settings.players = 2;
                settings.replaceDisconnected = false;
            } else if (body.mode === '1vAI') {
                settings.players = 1;
                settings.aiPlayers = 1;
                settings.replaceDisconnected = false;
            } else if (body.mode === '2v2') {
                settings.players = 4;
                settings.replaceDisconnected = true;
            } else if (body.mode === 'All vs All') {
                settings.players = 4;
                settings.replaceDisconnected = true;
            } else {
                return reply.status(400).send({ error: 'Invalid game mode' });
            }
            settings.winScore = 10;
            settings.timeLimit = 60000;
            settings.startScore = 0;
            
            const newMatch = await app.prisma.match.create({
                data: {
                    userId: request.user,
                    gameType: body.mode,
                    status: 'pending',
                    settings: settings,
                    participants: {
                        create: {
                            userId: request.user,
                            joinedAt: new Date(),
                        },
                    },
                },
            });
            await notifyMatchParticipants(newMatch.id);
            return reply.status(200).send({ message: 'Game created successfully', match: newMatch });
            
        } catch (error) {
            console.error('Error creating game:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    app.post('/settings', async (request, reply) => {
        try {
            const settings = request.body as GameSettings;
            
            // Validate settings
            if (settings.players < 1 || settings.players > 4) {
                return reply.status(400).send({ error: 'Invalid number of players' });
            }
            if (settings.aiPlayers && (settings.aiPlayers < 0 || settings.aiPlayers > 3)) {
                return reply.status(400).send({ error: 'Invalid number of AI players' });
            }
            if (settings.winScore && settings.winScore < 1) {
                return reply.status(400).send({ error: 'Invalid win score' });
            }
            if (settings.timeLimit && settings.timeLimit < 60000) { // Minimum 1 minute
                return reply.status(400).send({ error: 'Invalid time limit' });
            }

            // Create a new game record and set the settings
            const match = await app.prisma.match.create({
                data: {
                    userId: request.user,
                    gameType: 'Pong',
                    status: 'pending',
                    settings: settings,
                    participants: {
                        create: {
                            userId: request.user,
                            joinedAt: new Date(),
                        },
                    },
                },
            });
            
            return reply.status(200).send({ message: 'Game settings saved successfully', match });
        } catch (error) {
            console.error('Error saving game settings:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // leave queue (get current match for participant and delete)
    app.post('/leave-queue', async (request, reply) => {
        const match = await checkMatch(request.user);
        if (match) {
            await app.prisma.matchParticipant.deleteMany({ where: { matchId: match.id, userId: request.user } });
            return reply.status(200).send({ message: 'Left queue successfully' });
        }
        return reply.status(404).send({ error: 'No match found' });
    });

    // get is in queue
    app.get('/is-in-queue', async (request, reply) => {
        const match = await checkMatch(request.user);
        return reply.status(200).send({ message: 'In queue', inQueue: match !== null, since: match?.createdAt });
    });
} 