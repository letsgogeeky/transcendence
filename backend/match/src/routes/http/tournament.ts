// tournament routes

import { FastifyInstance } from 'fastify';
import credentialAuthCheck from '../../plugins/validateToken.js';

interface TournamentOptions {
    winCondition: string; // score or time
    limit: number;
}

interface TournamentPayload {
    name: string;
    options: TournamentOptions;
    participants: string[];
}

export function tournamentRoutes(app: FastifyInstance) {
    app.register(credentialAuthCheck);
    app.get('/', async (request, reply) => {
        // get all tournaments
        const tournaments = await app.prisma.tournament.findMany({
                include: {
                    participants: true,
                    matches: true,
                },
            });
            return reply.status(200).send({
            tournaments,
        });
    });
    // get tournament by id
    app.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const tournament = await app.prisma.tournament.findUnique({
                where: { id }, include: {
                    participants: true,
                    matches: true,
                }
            });
            if (!tournament) {
                return reply.status(404).send({
                    message: 'Tournament not found',
                });
            }
            return reply.status(200).send({
                tournament,
            });
    });

    // get all tournaments by participant id
    app.get('/participant/:id', async (request, reply) => {
            const { id } = request.params as { id: string };
            const tournaments = await app.prisma.tournament.findMany({
                where: {
                    participants: {
                        some: { id },
                    },
                },
                include: {
                    participants: true,
                    matches: true,
                },
            });
        return reply.status(200).send({
            tournaments,
        });
    });

    // create a tournament
    app.post('/', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    options: {
                        type: 'object', properties: {
                            winCondition: { type: 'string' },
                            limit: { type: 'number' },
                        },
                        required: ['winCondition'],
                    },
                    participants: { type: 'array', items: { type: 'string' } },
                },
            },
        },
    },
    async (request, reply) => {
        // create a tournament
        const { name, options, participants } = request.body as TournamentPayload;
        if (options.winCondition === 'score' && !options.limit) {
                return reply.status(400).send({
                    message: 'Win score is required for score-based tournaments',
                });
            }
            if (options.winCondition === 'time' && !options.limit) {
                return reply.status(400).send({
                    message: 'Win time is required for time-based tournaments',
                });
            }
            if (options.winCondition !== 'score' && options.winCondition !== 'time') {
                return reply.status(400).send({
                    message: 'Invalid win condition. Must be either "score" or "time"',
                });
            }

            const tournament = await app.prisma.tournament.create({
                data: {
                    name: name,
                    adminId: request.user,
                    options: {
                        winCondition: options.winCondition,
                        limit: options.limit,
                    },
                    status: 'active',
                    participants: {
                        connect: participants.map((participant) => ({ id: participant })),
                    },
                },
                include: {
                    matches: true,
                    participants: true,
                },
            });
            return reply.status(200).send({
                tournament,
            });
        },
    );
    // add participant to a tournament
    app.post('/:id/add-player', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    playerId: { type: 'string' },
                },
            },
        },
    },
    async (request, reply) => {
        const { id } = request.params as { id: string };
        const { playerId } = request.body as { playerId: string };
        const tournament = await app.prisma.tournament.findUnique({ where: { id }, include: {
                participants: true,
                matches: true,
            } });
            if (!tournament) {
                return reply.status(404).send({
                    message: 'Tournament not found',
                });
            }
            // Check if user is admin
            if (tournament.adminId !== request.user) {
                return reply.status(403).send({
                    message: 'Only tournament admin can add participants',
                });
            }
        const tournamentParticipant = {
            tournamentId: tournament.id,
            userId: playerId,
            status: 'pending',
        }
        await app.prisma.tournamentParticipant.create({ data: tournamentParticipant });

        // Send notification to the added participant
        const participantSocket = app.connections.get(playerId);
        if (participantSocket) {
            participantSocket.send(JSON.stringify({
                type: 'TOURNAMENT_INVITATION',
                tournamentId: tournament.id,
                tournamentName: tournament.name,
                message: `You've been invited to join tournament "${tournament.name}"`
            }));
        }

        const updatedTournament = await app.prisma.tournament.findUnique({ where: { id }, include: {
                participants: true,
                matches: true,
            } });
        return reply.status(200).send({
            tournament: updatedTournament,
        });
    });
    // start a tournament
    app.post('/:id/start', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    },
    async (request, reply) => {
        const { id } = request.params as { id: string };
        const tournament = await app.prisma.tournament.findUnique({ where: { id }, include: {
                participants: true,
                matches: true,
            } });
            if (!tournament) {
                return reply.status(404).send({
                    message: 'Tournament not found',
                });
            }
            if (tournament.status !== 'active') {
                return reply.status(400).send({
                    message: 'Tournament is not active',
                });
            }
            if (tournament.participants.length < 2) {
                return reply.status(400).send({
                    message: 'Tournament must have at least 2 participants',
                });
            }
            // split participants into arrays of 2
            const participants = tournament.participants;
            const matches = [];
            for (let i = 0; i < participants.length; i += 2) {
                const match = await app.prisma.match.create({
                    data: {
                        tournamentId: tournament.id,
                        userId: participants[i].id,
                        gameType: 'Pong',
                        status: 'pending',
                        participants: {
                            connect: [participants[i], participants[i + 1]],
                        },
                    },
                });
                matches.push(match);
            }
            return reply.status(200).send({
                matches,
            });
        },
    );

    // leave a tournament
    app.post('/:id/leave', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { userId } = request.body as { userId: string };
        const tournament = await app.prisma.tournament.findUnique({ where: { id }, include: {
            participants: true,
        } });
        if (!tournament) {
            return reply.status(404).send({
                message: 'Tournament not found',
            });
        }
        // Check if user is admin or the participant themselves
        if (tournament.adminId !== request.user && userId !== request.user) {
            return reply.status(403).send({
                message: 'Only tournament admin can remove participants',
            });
        }
        const tournamentParticipant = await app.prisma.tournamentParticipant.findFirst({ where: { tournamentId: id, userId: userId } });
        if (!tournamentParticipant) {
            return reply.status(404).send({
                message: 'Participant not found',
            });
        }
        await app.prisma.tournamentParticipant.delete({ where: { id: tournamentParticipant.id } });

        // Send notification to the removed participant
        const removedUserSocket = app.connections.get(userId);
        if (removedUserSocket && request.user !== userId) {
            removedUserSocket.send(JSON.stringify({
                type: 'TOURNAMENT_UPDATE',
                tournamentId: tournament.id,
                message: `You have been removed from tournament "${tournament.name}"`
            }));
        }

        // Send notification to the tournament admin
        if (tournament.adminId) {
            const adminSocket = app.connections.get(tournament.adminId as string);
            if (adminSocket && request.user !== tournament.adminId) {
                try {
                    // Get user info from auth service
                    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/user/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${request.headers.authorization}`
                        }
                    });
                    if (response.ok) {
                        const userData = await response.json() as { name: string };
                        adminSocket.send(JSON.stringify({
                            type: 'TOURNAMENT_UPDATE',
                            tournamentId: tournament.id,
                            message: `User ${userData.name} has left tournament "${tournament.name}"`
                        }));
                    }
                } catch (error) {
                    console.error('Error sending admin notification:', error);
                }
            }
        }

        return reply.status(200).send({
            message: 'Participant left tournament',
        });
    });

    // delete a tournament
    app.delete('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const tournament = await app.prisma.tournament.findUnique({ where: { id }, include: {
            participants: true,
            matches: true,
        } });
        if (!tournament) {
            return reply.status(404).send({
                message: 'Tournament not found',
            });
        }

        // Check if user is admin
        if (tournament.adminId !== request.user) {
            return reply.status(403).send({
                message: 'Only tournament admin can delete the tournament',
            });
        }

        // Delete all tournament participants
        await app.prisma.tournamentParticipant.deleteMany({
            where: { tournamentId: id }
        });

        // Delete all matches associated with the tournament
        await app.prisma.match.deleteMany({
            where: { tournamentId: id }
        });

        // Finally delete the tournament
        await app.prisma.tournament.delete({
            where: { id }
        });

        return reply.status(200).send({
            message: 'Tournament deleted successfully',
        });
    });
}