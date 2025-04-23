import { FastifyInstance, FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import { GameSession, GameSettings, GameStatus } from "./session.js";
import credentialAuthCheck from "../../plugins/validateToken.js";
import https from 'https';

type GameMessage = {
    type: string;
    match_id: string;
    data: any;
}

let gameSettings = {players: 2, aiPlayers: 0, winScore: 10, timeLimit: 3 * 60 * 1000, replaceDisconnected: true,
	startScore: 5, terminatePlayers: false, teams: [[], []], friendlyFire: false
};

let game1 = new GameSession("match_1", gameSettings);
//let game2 = new GameSession("match_2", gameSettings);
let gameServer = game1;

export function gameRoutes(app: FastifyInstance) {
    app.register(credentialAuthCheck);
    app.route({
        method: 'GET',
        url: '/',
        handler: (request, reply) => {
            reply.send('Game WebSocket!');
        },
        wsHandler: async (socket: WebSocket, req: FastifyRequest) => {
		   console.log("User " + req.user + " connected");
            if (!req.user) {
                console.warn(`User not found for socket ${req.socket.remoteAddress}`);
                socket.close();
                return;
            }

			// const user = await app.prisma.user.findUnique({
			// 	where: { id: req.id },
			// 	select: { name: true },
			// });
			//console.log(user);

			// app.prisma.userName.findUnique({where: {id: req.user}}).then((user: { name: string; }) => {userName = user.name;});
			// try {
			// 	const userResponse = await app.prisma.user.findUnique({
			// 		where: { id: req.user },
			// 		select: {
			// 			name: true,
			// 			avatarUrl: true
			// 		}
			// 	});
			// 	if (userResponse) {
			// 		userName = userResponse.name;
			// 	}
			// } catch (error) {
			// 	console.error('Error fetching user:', error);
			// }
		
			if (gameServer.status == GameStatus.ONGOING)
				gameServer = new GameSession("", gameSettings);
			//gameServer = game1.clients.size < game2.clients.size ? game1 : game2;
			gameServer.handleConnection(req.user, req.userName, socket);
			gameServer.addToTeam(req.user, app.connections.size % 2);
            app.connections.set(req.user, socket);
            socket.on('message', (message: string) => {
                (async () => {
					gameServer.handleMessage(req.user, message);
                    //if (typeof message === 'string') {
						// const match = await app.prisma.match.findUnique({
						// 	where: {
						// 		id: parsedMessage.match_id,
						// 	},
						// 	include: {
						// 		participants: true,
						// 	},
						// });
						

						// const user_ids = match?.participants.map((participant: { userId: string }) => participant.userId);
						// if (user_ids) {
						// 	const clients = user_ids.map((user_id: string) => app.connections.get(user_id));
						// 	clients.forEach((client: { send: (arg0: string) => void; }) => {
						// 		if (client) {
						// 			client.send(JSON.stringify({placeholder: ""}));
						// 		}
						// 	});
						// } else {
						// 	console.log(`No clients found for match ${parsedMessage.match_id}`);
						// }
                    // }
                    // else {
                    //     console.log(`Received non-string message from ${req.user}`);
                    // }
                })().catch(error => {
                    console.error('Error handling message:', error);
                });
            });
            socket.on('close', async () => {
                if (!req.user) {
                    console.log(`User not found for socket ${req.socket.remoteAddress}`);
                    socket.close();
                    return;
                }
				if (gameServer.status == GameStatus.ENDED) {
					gameServer.dispose();
					gameServer = new GameSession("new_match", gameSettings);
				}
				gameServer.handleClose(req.user);
                app.connections.delete(req.user);
                // Announce user left the match
				//const user = req.user;
                // get current match that includes the user
                // const match = await app.prisma.match.findFirst({
                //     where: {
                //         participants: {
                //             some: {
                //                 userId: user,
                //             },
                //         },
                //     },
                //     include: {
                //         participants: true,
                //     },
                // });
                // if (match) {
                //     const clients = match.participants.map((participant: { userId: string }) => app.connections.get(participant.userId));
                //     clients.forEach((client: { send: (arg0: string) => void; }) => {
                //         if (client) {
                //             client.send(JSON.stringify({
                //                 type: messageTypes.JOIN_LEAVE_MATCH,
                //                 match_id: match.id,
                //                 data: {
                //                     user_id: user,
                //                 },
                //             }));
                //         }
                //     });
                // }
                // TODO: handle game end
                // Update match if the user was in the middle of a match

                console.log(`User ${req.user} disconnected`);
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
