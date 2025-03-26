// a websocket route for chat

import { FastifyInstance } from "fastify";

type PaddleMove = {
    user_id: string;
    x: number;
    y: number;
};

// Define other message types similarly

// Example for BallMove
type BallMove = {
    x: number;
    y: number;
    direction: string;
};

type Score = {
    scoring_user_id: string;
    scored_user_id: string;
    score: number;
};

type JoinLeaveMatch = {
    user_id: string;
};

// Update GameMessage type
type GameMessage = {
    type: string;
    match_id: string;
    data: PaddleMove | BallMove | Score | JoinLeaveMatch; // Update this to GameMessageData when all types are defined
}

const messageTypes = {
    PADDLE_MOVE: 'paddle_move',
    BALL_MOVE: 'ball_move',
    SCORE: 'score',
    JOIN_LEAVE_MATCH: 'join_leave_match',
}

export function chatRoutes(app: FastifyInstance) {
    app.route({
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
            app.connections.set(req.user, socket);
            socket.on('message', (message) => {
                (async () => {
                    console.log(message);
                    if (typeof message === 'string') {
                        const parsedMessage = JSON.parse(message) as GameMessage;
                        if (parsedMessage.type === messageTypes.PADDLE_MOVE) {
                            const paddleMove = parsedMessage.data as PaddleMove;
                            const match = await app.prisma.match.findUnique({
                                where: {
                                    id: parsedMessage.match_id,
                                },
                                include: {
                                    participants: true,
                                },
                            });
                            const user_ids = match?.participants.map((participant: { userId: string }) => participant.userId);
                            if (user_ids) {
                                const clients = user_ids.map((user_id: string) => app.connections.get(user_id));
                                clients.forEach((client) => {
                                    if (client) {
                                        client.send(JSON.stringify(paddleMove));
                                    }
                                });
                            } else {
                                console.log(`No clients found for match ${parsedMessage.match_id}`);
                            }
                        }
                        else if (parsedMessage.type === messageTypes.BALL_MOVE) {
                            // TODO: handle ball move
                            const ballMove = parsedMessage.data as BallMove;
                            const match = await app.prisma.match.findUnique({
                                where: {
                                    id: parsedMessage.match_id,
                                },
                                include: {
                                    participants: true,
                                },
                            });
                            const user_ids = match?.participants.map((participant: { userId: string }) => participant.userId);
                            if (user_ids) {
                                const clients = user_ids.map((user_id: string) => app.connections.get(user_id));
                                clients.forEach((client) => {
                                    if (client) {
                                        client.send(JSON.stringify(ballMove));
                                    }
                                });
                            } else {
                                console.log(`No clients found for match ${parsedMessage.match_id}`);
                            }
                        }
                        else if (parsedMessage.type === messageTypes.SCORE) {
                            // TODO: handle score
                            const score = parsedMessage.data as Score;
                            const match = await app.prisma.match.findUnique({
                                where: {
                                    id: parsedMessage.match_id,
                                },
                                include: {
                                    participants: true,
                                },
                            });
                            const user_ids = match?.participants.map((participant: { userId: string }) => participant.userId);
                            if (user_ids) {
                                const clients = user_ids.map((user_id: string) => app.connections.get(user_id));
                                clients.forEach((client) => {
                                    if (client) {
                                        client.send(JSON.stringify(score));
                                    }
                                });
                            } else {
                                console.log(`No clients found for match ${parsedMessage.match_id}`);
                            }
                        }
                        else if (parsedMessage.type === messageTypes.JOIN_LEAVE_MATCH) {
                            // TODO: handle join/leave match
                            const joinLeaveMatch = parsedMessage.data as JoinLeaveMatch;
                            const match = await app.prisma.match.findUnique({
                                where: {
                                    id: parsedMessage.match_id,
                                },
                                include: {
                                    participants: true,
                                },
                            });
                            const user_ids = match?.participants.map((participant: { userId: string }) => participant.userId);
                            if (user_ids) {
                                const clients = user_ids.map((user_id: string) => app.connections.get(user_id));
                                clients.forEach((client) => {
                                    if (client) {
                                        client.send(JSON.stringify(joinLeaveMatch));
                                    }
                                });
                            } else {
                                console.log(`No clients found for match ${parsedMessage.match_id}`);
                            }
                        }
                        else {
                            console.log(`Received unknown message type: ${parsedMessage.type}`);
                        }
                    }
                    else {
                        console.log(`Received non-string message from ${req.user}`);
                    }
                })().catch(error => {
                    console.error('Error handling message:', error);
                });
            });
            socket.on('close', () =>  (async () => {
                if (!req.user) {
                    console.log(`User not found for socket ${req.socket.remoteAddress}`);
                    socket.close();
                    return;
                }
                const user = req.user;
                app.connections.delete(user);
                // Announce user left the match
                // get current match that includes the user
                const match = await app.prisma.match.findFirst({
                    where: {
                        participants: {
                            some: {
                                userId: user,
                            },
                        },
                    },
                    include: {
                        participants: true,
                    },
                });
                if (match) {
                    const clients = match.participants.map((participant: { userId: string }) => app.connections.get(participant.userId));
                    clients.forEach((client) => {
                        if (client) {
                            client.send(JSON.stringify({
                                type: messageTypes.JOIN_LEAVE_MATCH,
                                match_id: match.id,
                                data: {
                                    user_id: user,
                                },
                            }));
                        }
                    });
                }
                // TODO: handle game end
                // Update match if the user was in the middle of a match

                console.log(`User ${req.user} disconnected`);
                socket.close();
                return;
            }));
            socket.on('error', (error) => {
                console.error('WebSocket Error:', error);
            });
            socket.on('open', () => {
                console.log('WebSocket Opened!');
                // TODO: handle game start
                // Announce user joined the match
                
            });
        },
    });
}

// {
//     "type": "paddle_move",
//     "data": {
//         "user_id": "123",
//         "x": 100,
//         "y": 200
//     }
// }

// {
//     "type": "ball_move",
//     "data": {
//         "x": 100,
//         "y": 200,
//         "direction": "up"
//     }
// }

