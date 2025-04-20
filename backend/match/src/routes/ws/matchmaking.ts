import { FastifyInstance, FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import credentialAuthCheck from "../../plugins/validateToken.js";

// Define message types for matchmaking and tournament notifications
const messageTypes = {
    // Tournament related
    TOURNAMENT_INVITATION: 'TOURNAMENT_INVITATION',
    TOURNAMENT_STARTED: 'TOURNAMENT_STARTED',
    TOURNAMENT_ENDED: 'TOURNAMENT_ENDED',
    TOURNAMENT_UPDATE: 'TOURNAMENT_UPDATE',
    TOURNAMENT_MATCH_READY: 'TOURNAMENT_MATCH_READY',
    TOURNAMENT_MATCH_START: 'TOURNAMENT_MATCH_START',
    TOURNAMENT_MATCH_END: 'TOURNAMENT_MATCH_END',
    
    // Matchmaking related
    MATCH_INVITATION: 'MATCH_INVITATION',
    MATCH_READY: 'MATCH_READY',
    
    // User actions
    ACCEPT_TOURNAMENT: 'ACCEPT_TOURNAMENT',
    REJECT_TOURNAMENT: 'REJECT_TOURNAMENT',
    ACCEPT_MATCH: 'ACCEPT_MATCH',
    REJECT_MATCH: 'REJECT_MATCH'
};

// Define message interfaces
interface BaseMessage {
    type: string;
    tournamentId?: string;
    matchId?: string;
    message?: string;
}

interface TournamentMessage extends BaseMessage {
    tournamentName?: string;
}

interface MatchMessage extends BaseMessage {
    opponentId?: string;
    opponentName?: string;
}

export function matchmakingRoutes(app: FastifyInstance) {
    app.register(credentialAuthCheck);
    app.route({
        method: 'GET',
        url: '/',
        handler: (request, reply) => {
            reply.send('Matchmaking WebSocket!');
        },
        wsHandler: (socket: WebSocket, req: FastifyRequest) => {
            console.log(`User ${req.user} connected to matchmaking socket`);
            
            // Add socket to connections map
            app.connections.set(req.user, socket);

            // Handle incoming messages
            socket.on('message', (message: string) => {
                try {
                    const parsedMessage = JSON.parse(message) as BaseMessage;
                    
                    switch (parsedMessage.type) {
                        case messageTypes.ACCEPT_TOURNAMENT:
                            void handleTournamentAccept(app, req.user, parsedMessage as TournamentMessage);
                            break;
                        case messageTypes.REJECT_TOURNAMENT:
                            void handleTournamentReject(app, req.user, parsedMessage as TournamentMessage);
                            break;
                        case messageTypes.ACCEPT_MATCH:
                            void handleMatchAccept(app, req.user, parsedMessage as MatchMessage);
                            break;
                        case messageTypes.REJECT_MATCH:
                            void handleMatchReject(app, req.user, parsedMessage as MatchMessage);
                            break;
                        default:
                            console.warn(`Unknown message type: ${parsedMessage.type}`);
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });

            // Handle socket close
            socket.on('close', () => {
                console.log(`User ${req.user} disconnected from matchmaking socket`);
                app.connections.delete(req.user);
            });

            // Handle socket errors
            socket.on('error', (error: Error) => {
                console.error('WebSocket Error:', error);
            });
        },
    });
}

// Helper functions for handling different message types
async function handleTournamentAccept(app: FastifyInstance, userId: string, message: TournamentMessage) {
    if (!message.tournamentId) {
        console.error('Missing tournamentId in ACCEPT_TOURNAMENT message');
        return;
    }

    try {
        // Update tournament participant status in database
        const tournament = await app.prisma.tournament.update({
            where: { id: message.tournamentId },
            data: {
                participants: {
                    update: {
                        where: { userId_tournamentId: { userId, tournamentId: message.tournamentId } },
                        data: { status: 'ACCEPTED' }
                    }
                }
            },
            include: { participants: true }
        });

        // Notify tournament creator about acceptance
        const creatorSocket = app.connections.get(tournament.creatorId);
        if (creatorSocket) {
            creatorSocket.send(JSON.stringify({
                type: messageTypes.TOURNAMENT_UPDATE,
                tournamentId: message.tournamentId,
                message: `User ${userId} has accepted the tournament invitation`
            }));
        }
    } catch (error) {
        console.error('Error handling tournament acceptance:', error);
    }
}

async function handleTournamentReject(app: FastifyInstance, userId: string, message: TournamentMessage) {
    if (!message.tournamentId) {
        console.error('Missing tournamentId in REJECT_TOURNAMENT message');
        return;
    }

    try {
        // Update tournament participant status in database
        const tournament = await app.prisma.tournament.update({
            where: { id: message.tournamentId },
            data: {
                participants: {
                    update: {
                        where: { userId_tournamentId: { userId, tournamentId: message.tournamentId } },
                        data: { status: 'REJECTED' }
                    }
                }
            },
            include: { participants: true }
        });

        // Notify tournament creator about rejection
        const creatorSocket = app.connections.get(tournament.creatorId);
        if (creatorSocket) {
            creatorSocket.send(JSON.stringify({
                type: messageTypes.TOURNAMENT_UPDATE,
                tournamentId: message.tournamentId,
                message: `User ${userId} has rejected the tournament invitation`
            }));
        }
    } catch (error) {
        console.error('Error handling tournament rejection:', error);
    }
}

async function handleMatchAccept(app: FastifyInstance, userId: string, message: MatchMessage) {
    if (!message.matchId) {
        console.error('Missing matchId in ACCEPT_MATCH message');
        return;
    }

    try {
        // Update match status in database
        const match = await app.prisma.match.update({
            where: { id: message.matchId },
            data: { status: 'ACCEPTED' },
            include: { participants: true }
        });

        // Notify opponent about acceptance
        const opponent = match.participants.find(p => p.userId !== userId);
        if (opponent) {
            const opponentSocket = app.connections.get(opponent.userId);
            if (opponentSocket) {
                opponentSocket.send(JSON.stringify({
                    type: messageTypes.MATCH_READY,
                    matchId: message.matchId,
                    message: 'Your opponent has accepted the match'
                }));
            }
        }
    } catch (error) {
        console.error('Error handling match acceptance:', error);
    }
}

async function handleMatchReject(app: FastifyInstance, userId: string, message: MatchMessage) {
    if (!message.matchId) {
        console.error('Missing matchId in REJECT_MATCH message');
        return;
    }

    try {
        // Update match status in database
        const match = await app.prisma.match.update({
            where: { id: message.matchId },
            data: { status: 'REJECTED' },
            include: { participants: true }
        });

        // Notify opponent about rejection
        const opponent = match.participants.find(p => p.userId !== userId);
        if (opponent) {
            const opponentSocket = app.connections.get(opponent.userId);
            if (opponentSocket) {
                opponentSocket.send(JSON.stringify({
                    type: messageTypes.MATCH_INVITATION,
                    matchId: message.matchId,
                    message: 'Your opponent has rejected the match'
                }));
            }
        }
    } catch (error) {
        console.error('Error handling match rejection:', error);
    }
} 