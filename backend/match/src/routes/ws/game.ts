import { FastifyInstance, FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import { GameSession, GameSettings, GameStatus } from "./session.js";
import credentialAuthCheck from "../../plugins/validateToken.js";

const paddleMoveMessageTypes = ["moveUp", "moveDown", "turnLeft", "turnRight", "stopMoving", "stopTurning"];

export function gameRoutes(app: FastifyInstance) {
    app.register(credentialAuthCheck);
    app.route({
        method: 'GET',
        url: '/',
        handler: (request, reply) => {
            reply.send('Game WebSocket!');
        },
        wsHandler: async (socket: WebSocket, req: FastifyRequest) => {
            let gameServer: GameSession;
		    console.log("User " + req.user + " connected to game websocket");
            if (!req.user) {
                console.warn(`User not found for socket ${req.socket.remoteAddress}`);
                socket.close();
                return;
            }
            
            let match = null;
            if (req.matchId) {
                match = await app.prisma.match.findFirst({
                    where: {
                        status: { in: ['pending', 'in progress'] },
                        id: req.matchId,
                        participants: {
                            some: { userId: req.user }
                        }
                    }
                });
            } else if (req.tournamentId) {
                match = await app.prisma.match.findFirst({
                    where: {
                        status: { in: ['pending', 'in progress'] },
                        tournamentId: req.tournamentId,
                        participants: {
                            some: { userId: req.user }
                        }
                    }
                });
            }
            if (match) {
                console.log(`Found match ${match.id}`);
                gameServer = app.gameSessions.get(match.id) as GameSession;
                if (!gameServer) {
                    console.log(`Creating new game session for match ${match.id}`);
                    gameServer = new GameSession(match.id, match.settings as GameSettings, app);
                    app.gameSessions.set(match.id, gameServer);
                }
            } else {
                console.log(`No match found for user ${req.user}`);
                socket.close();
                return;
            }
			gameServer.handleConnection(req.user, req.userName, socket);
            app.gameConnections.set(req.user, socket);
            socket.on('message', (message: string) => {
                const data = JSON.parse(message) as { type: string, data: any };
                console.log(`Received message from ${req.user}: ${JSON.stringify(data)}`);
				if (paddleMoveMessageTypes.includes(data.type)) {
					gameServer.handleMessage(req.user, data);
				}
            });
            socket.on('close', () => {
                if (!req.user) {
                    console.log(`User not found for socket ${req.socket.remoteAddress}`);
                    socket.close();
                    return;
                }
				if (gameServer.status == GameStatus.ENDED) {
					gameServer.dispose();
				}
				gameServer.handleClose(req.user);
                app.gameConnections.delete(req.user);

                console.log(`User ${req.user} disconnected from game websocket`);
                socket.close();
                return;
            });

            socket.on('error', (error: any) => {
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
