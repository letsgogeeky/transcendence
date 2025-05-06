import { FastifyInstance } from "fastify";
import credentialAuthCheck from "../../plugins/validateToken.js";
import { GameSettings } from "../ws/session.js";
import { checkMatch, createMatch, deleteMatch, ensurePlayersInMatchesAreConnected, getPlayerLevelAgainstAI, getUserMatches, notifyMatchParticipants } from "../../services/match.service.js";
// List of game modes
// 1. 1v1
// 2. 1vAI
// 3. 2v2
// 4. All vs All

interface PreconfiguredGameSettings {
    mode: string;
    userIds?: string[];
    matchId?: string;
}

export function gameHttpRoutes(app: FastifyInstance) {

    app.register(credentialAuthCheck);

    app.get('/check-match', async (request, reply) => {
        const match = await checkMatch(request.user, app);
        if (match) {
            return reply.status(200).send({ message: 'Match found', match });
        }
        return reply.status(404).send({ error: 'No match found' });
    });

    app.post('/create-preconfigured', async (request, reply) => {
        // check if user is already in a match
        const match = await checkMatch(request.user, app);
        if (match) {
            return reply.status(400).send({ error: 'You are already in a match!' });
        }
        try {
            const body = request.body as PreconfiguredGameSettings;
            // get current pending match with same game type
            const query: { gameType: string, status: string, id?: string } = {
                gameType: body.mode,
                status: 'pending',
            }

            if (body.matchId) {
                query.id = body.matchId;
            }
            const match = await app.prisma.match.findFirst({
                where: query,
                include: {
                    participants: true,
                },
            });
            if (match && match.settings) {
                if (match.participants.some(participant => participant.userId === request.user)) {
                    return reply.status(400).send({ error: 'You are already in a match' });
                }
                const guestsCount = (match.settings as GameSettings).guests?.length ?? 0;
                if (match.participants.length >= (match.settings as GameSettings).players - guestsCount) {
                    // create new match
                    const newMatch = await createMatch(app, body.mode, request.user, body.userIds?.length ? body.userIds : [request.user]);
                    if (!newMatch) {
                        return reply.status(400).send({ error: 'Invalid game mode!' });
                    }
                    await notifyMatchParticipants(newMatch.id, app);
                    return reply.status(200).send({ message: 'Game created successfully!', match: newMatch });
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
                await notifyMatchParticipants(match.id, app);
                return reply.status(200).send({ message: 'Game created successfully', match });
            }
            const newMatch = await createMatch(app, body.mode, request.user, body.userIds?.length ? body.userIds : [request.user]);
            if (!newMatch) {
                return reply.status(400).send({ error: 'Invalid game mode' });
            }
            await notifyMatchParticipants(newMatch.id, app);
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
            if (settings.players < 1 || settings.players + (settings.aiPlayers ?? 0) > 8) {
                return reply.status(400).send({ error: 'Invalid number of players' });
            }
            // if (settings.aiPlayers && (settings.aiPlayers < 0 || settings.aiPlayers > 300)) {
            //     return reply.status(400).send({ error: 'Invalid number of AI players' });
            // }
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
        const match = await checkMatch(request.user, app);
        if (match) {
            if (match.tournamentId !== null && match.tournamentId !== '') {
                return reply.status(400).send({ error: 'Cannot leave queue for tournament match' });
            }
            await app.prisma.matchParticipant.deleteMany({ where: { matchId: match.id, userId: request.user } });
            // check if match is empty, delete it
            const participants = await app.prisma.matchParticipant.findMany({ where: { matchId: match.id } });
            if (participants.length === 0) {
                await app.prisma.match.delete({ where: { id: match.id } });
            }
            return reply.status(200).send({ message: 'Left queue successfully' });
        }
        return reply.status(404).send({ error: 'No match found' });
    });

    // get is in queue
    app.get('/is-in-queue', async (request, reply) => {
        await ensurePlayersInMatchesAreConnected(app, request.user);
        console.log('is in queue');
        const match = await checkMatch(request.user, app);
        return reply.status(200).send({ message: 'In queue', inQueue: match !== null, since: match?.createdAt });
    });

    app.get('/get-player-level-against-ai', async (request, reply) => {
        const level = await getPlayerLevelAgainstAI(request.user, app);
        return reply.status(200).send({ message: 'Player level', level });
    });

    app.get('/get-user-matches', async (request, reply) => {
        const matches = await getUserMatches(app, request.user);
        return reply.status(200).send({ message: 'User matches', matches });
    });

    // delete match
    app.delete('/delete-match/:matchId', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    matchId: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        const matchId = (request.params as { matchId: string }).matchId;
        if (!matchId) {
            return reply.status(400).send({ error: 'Match ID is required' });
        }
        const match = await deleteMatch(app, matchId, request.user);
        if (!match) {
            return reply.status(400).send({ error: 'Cannot delete match' });
        }
        return reply.status(200).send({ message: 'Match deleted', match });
    });

    app.get('/get-custom-games', async (request, reply) => {
        try {
            const matches = await app.prisma.match.findMany({
                where: {
                    gameType: 'custom',
                    status: 'pending',
                },
                include: {
                    participants: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            return reply.status(200).send({ matches });
        } catch (error) {
            console.error('Error getting custom games:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });



    const isValidSettings = (settings: GameSettings) : string | null => {
         // Validate settings
         if (settings.players < 1 || settings.players + (settings.aiPlayers ?? 0) > 8) {
            return 'Invalid number of players';
        }
        // if (settings.aiPlayers && (settings.aiPlayers < 0 || settings.aiPlayers > 300)) {
        //     return 'Invalid number of AI players';
        // }
        if (settings.timeLimit && settings.timeLimit < 60000) { // Minimum 1 minute
            return 'Invalid time limit';
        }
        if (settings.balls && (settings.balls < 1 || settings.balls > 10)) {
            return 'Invalid number of balls';
        }
        if (settings.aiLevel && (settings.aiLevel < 1 || settings.aiLevel > 10)) {
            return 'Invalid AI level';
        }
        if (settings.winScore && settings.winScore < 1) {
            return 'Invalid win score';
        }
        if (settings.timeLimit == 0 && settings.winScore == 0) {
            return 'Cannot set both time limit and win score to 0';
        }
        if (settings.timeLimit && settings.timeLimit > 0 && settings.winScore && settings.winScore > 0) {
            return 'Cannot set both time limit and win score';
        }
        if (settings.startScore && settings.startScore < 0) {
            return 'Invalid start score';
        }
        if (settings.startScore && settings.winScore && settings.startScore > settings.winScore) {
            return 'Start score cannot be greater than win score';
        }
        if (settings.startScore && (settings.startScore <= 0 && settings.terminatePlayers)) {
            return 'Cannot set start score to 0 when terminating players';
        }
		if (settings.kickerMode && settings.kickerMode === true && (settings.players > 2 || (settings.aiPlayers && settings.aiPlayers + settings.players > 2))) {
			return 'Cannot set kicker mode in a game with more than 2 total players and AIs';
		}
        return null;
    }

    app.post('/create-custom', async (request, reply) => {
        try {
            const settings = request.body as GameSettings;
            const currentMatch = await checkMatch(request.user, app);
            if (currentMatch) {
                return reply.status(400).send({ error: 'You are already in a match / queue!' });
            }
            // Validate settings
            const error = isValidSettings(settings);
            if (error) {
                return reply.status(400).send({ error });
            }
			settings.gainPoints = true;
			settings.losePoints = false;
            // Create a new match with custom settings
            const match = await app.prisma.match.create({
                data: {
                    userId: request.user,
                    gameType: 'custom',
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
            await notifyMatchParticipants(match.id, app);
            return reply.status(200).send({ message: 'Custom game created successfully', match });
        } catch (error) {
            console.error('Error creating custom game:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    app.get('/get-match/:matchId', async (request, reply) => {
        const matchId = (request.params as { matchId: string }).matchId;
        if (!matchId) {
            return reply.status(400).send({ error: 'Match ID is required' });
        }
        const match = await app.prisma.match.findFirst({
            where: { id: matchId },
            include: {
                participants: true,
            },
        });
        if (!match) {
            return reply.status(404).send({ error: 'Match not found' });
        }
        return reply.status(200).send({ message: 'Match', match });
    });
} 