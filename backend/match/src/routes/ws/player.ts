import { Paddle } from './paddle.js'
import { WebSocket } from "ws";

export class Player {
	id: string;
	name: string;
	ws?: WebSocket;
	paddle?: Paddle;
	score: number = 0;
	team?: Player[];
	teamNumber?: number;
	guest?: Player;

	constructor(id: string, name: string, ws?: WebSocket) {
		this.id = id;
		this.name = name;
		this.ws = ws;
	}
}