import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Paddle } from './paddle.js'
import { buildScene } from './scene.js';
import { Ball } from './ball.js';
import { WebSocket } from "ws";
import { Player } from './player.js';
import { FastifyInstance } from 'fastify';

export async function loadPhysics() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	const wasmPath = join(__dirname, '../../../node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm');
    const wasmBinary = readFileSync(wasmPath);
    const havokInstance = await HavokPhysics({ wasmBinary });
    return havokInstance;
}

export type GameSettings = {
	players: number,
	aiPlayers?: number,
	timeLimit?: number,
	startScore?: number,
	winScore?: number,
	replaceDisconnected?: boolean,
	terminatePlayers?: boolean,
	teams?: string[][],
	guests?: string[],
	friendlyFire?: boolean,
	kickerMode?: boolean,
	obstacleMode?: number,
	balls?: number
	aiLevel?: number
}

export enum GameStatus {
	WAITING,
	ONGOING,
	PAUSED,
	ENDED
}

export class GameSession {
    engine!: BABYLON.NullEngine;
    scene!: BABYLON.Scene;
	simScene!: BABYLON.Scene;
	players = new Map<string, Player>();
	paddles: Paddle[] = [];
	balls: Ball[] = [];
	status: GameStatus = GameStatus.WAITING;
	settings: GameSettings;
	id: string;
	teams: Player[][] = [];
	guests: Player[] = [];
	timePassed: number = 0;
	app: FastifyInstance;

    constructor(matchId: string, settings: GameSettings, app: FastifyInstance) {
		this.id = matchId;
		this.settings = settings;
		if (settings.aiPlayers == undefined) settings.aiPlayers = 0;
		if (settings.aiLevel == undefined) settings.aiLevel = 5;
		this.app = app;
    }

    private async createScene() {
        this.engine = new BABYLON.NullEngine();
        this.scene = new BABYLON.Scene(this.engine);
        const havokInstance = await loadPhysics();
        const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
		this.scene.enablePhysics(new BABYLON.Vector3(0, this.settings.kickerMode ? -14 : 0, 0), havokPlugin);

		if (this.settings.players == 0) this.startGameLoop().catch(err => console.error('Error starting game loop:', err));
    }

	public handleConnection(id: string, name: string, ws: WebSocket) {
		if (this.status == GameStatus.ENDED || this.players.has(id)) {
			const reason = this.status == GameStatus.ENDED ? 'Game ended' : 'User already connected';
			ws.send(JSON.stringify({type: 'connectionDenied', data: reason}));
			return;
		}
		this.players.set(id, new Player(id, name, ws));
		if (this.settings.guests?.includes(id)) this.addGuest(id);
		if (this.status == GameStatus.WAITING && this.players.size == this.settings.players) {
			console.log(`Starting game loop for match ${this.id}`);
			// set the match to in progress
			this.app.prisma.match.update({
				where: { id: this.id },
				data: { status: 'in progress' }
			}).catch((err: any) => console.error('Error updating match status:', err));
			this.startGameLoop().catch(err => console.error('Error starting game loop:', err));
		}
		else if (this.players.size > this.settings.players) {
			ws.send(JSON.stringify({type: 'spectator'}));
			this.sendScene(ws);
		}
		ws.send(JSON.stringify({type: 'settings', data: { ...this.settings, timeLimit: this.settings.timeLimit! - this.timePassed }}));
		this.sendPlayerList(ws);
    }

    public handleMessage(id: string, data: any) {
        try {
			const paddle = data.data? this.players.get(id)?.guest?.paddle : this.players.get(id)?.paddle;
			switch (data.type) {
				case 'moveUp': paddle?.moveUp(); break;
				case 'moveDown': paddle?.moveDown(); break;
				case 'turnLeft': paddle?.turnLeft(); break;
				case 'turnRight': paddle?.turnRight(); break;
				case 'stopMoving': paddle?.stopMoving(); break;
				case 'stopTurning': paddle?.stopTurning(); break;
			}
        } catch (e) {
            console.error('Invalid message:', data);
        }
    }

    public handleClose(id: string) {
		const disconnectedPlayer = this.players.get(id);
        if (this.status == GameStatus.ONGOING) {
			if (this.settings.replaceDisconnected && disconnectedPlayer?.paddle)
				disconnectedPlayer.paddle.player = undefined;
			else this.gameEnd("Lost connection to player");
		}
		if (this.players.get(id)?.guest)
			this.players.delete(this.players.get(id)!.guest!.id);
		this.players.delete(id);
    }

	public sendPlayerList(client: WebSocket | undefined) {
		const playerNames = Array.from(this.paddles).map(paddle => paddle.name);
		const teams = this.teams?.map(team => team.map(player => player.paddle?.name));
		client?.send(JSON.stringify({type: 'playerList', data: {players: playerNames, teams: teams}}));
	}

	public sendScene(client: WebSocket | undefined) {
		if (!client) return;
		const sceneString = JSON.stringify(BABYLON.SceneSerializer.Serialize(this.scene));
		client?.send(JSON.stringify({type: 'scene', data: sceneString}));
		this.sendPlayerList(client);
	}

	public async updateScore() {
		const scoreMap = new Map(this.paddles.map(paddle => [paddle.name, paddle.score]));
		const userIdToScoreMap = new Map(this.paddles.map(paddle => [paddle.player? paddle.player.id: paddle.name, paddle.score]));
		// scoremap as json object
		const scoreMapJson = Object.fromEntries(userIdToScoreMap);
		const currentStats = await this.app.prisma.match.findUnique({
			where: { id: this.id },
			select: { stats: true }
		});
		console.log(currentStats?.stats);

		if (scoreMapJson !== currentStats?.stats) {
			await this.app.prisma.match.update({
				where: { id: this.id },
				data: { stats: scoreMapJson }
			});
		}

		const teamScores = [];
		for (const team of this.teams ?? []) {
			let teamScore = 0;
			for (const player of team) {
				teamScore += player.score;
				teamScores.push(teamScore);
			}
			if (this.settings.winScore && teamScore >= this.settings.winScore) 
				this.gameEnd("Team " + team[0].teamNumber + " won!");
		}

		for (const player of this.players.values())
			player.ws?.send(JSON.stringify({type: 'score', 
			data: {playerScores: Object.fromEntries(scoreMap), teamScores: teamScores}}));

		for (const paddle of this.paddles) {
			if (this.settings.winScore && paddle.score >= this.settings.winScore)
				this.gameEnd();
			else if (paddle.score <= 0 && this.settings.terminatePlayers) {
				paddle.die();
				this.paddles = this.paddles.filter(p => p != paddle);
				if (this.paddles.length <= 1) this.gameEnd();
			}	
		}
	}

    private broadcastSceneState() {
		const paddlePositions = this.paddles.map(paddle => ({position: paddle.box.position, id: paddle.box.id}));
		const ballPositions = this.balls.map(ball => ({position: ball.position, id: ball.ball.id}));
		const meshPositions = [...paddlePositions, ...ballPositions];
		
		const meshRotations = this.balls.map(ball => ({rotation: ball.aggregate.transformNode.rotationQuaternion, id: ball.ball.id
		}));
		this.players.forEach((player) => {
			if (player.paddle)
				meshRotations.push({rotation: player.paddle.aggregate.transformNode.rotationQuaternion, id: player.paddle.box.id});
		})
		const targets = this.paddles.map(paddle => paddle.target).filter(target => target !== undefined);
		this.players.forEach((player) => {
		    player.ws?.send(JSON.stringify({type: 'sceneState', data: {positions: meshPositions, rotations: meshRotations, targets: targets}}));
		});
    }

	createTeam(players: string[], teamNumber: number) {
		const team = players.map(name => this.players.get(name)).filter(player => player !== undefined);
		team.forEach(player => (player.teamNumber = teamNumber, player.team = team));
		this.teams.push(team);
	}

	addToTeam(id: string, teamNumber: number) {
		if (this.settings.teams && this.settings.teams.length > teamNumber)
			this.settings.teams[teamNumber].push(id);
	}

	addGuest(id: string, teamNumber?: number) {
		const name = "Guest" + this.guests.length + 1;	
		const guest = new Player(name, name);
		const player = this.players.get(id);
		if (player && this.players.size < this.settings.players) {
			player.guest = guest;
			this.guests.push(guest);
			this.players.set(name, guest);
		}

		if (teamNumber && this.teams[teamNumber]) 
			this.teams[teamNumber].push(guest); 

		// if (this.status == GameStatus.WAITING && this.players.size == this.settings.players) {
		// 	this.startGameLoop();
		// }
	}

	private gameEnd(message?: string) {
	let winners: Paddle[] = [];
	if (this.players.size > 0) {
		const paddlesArray = Array.from(this.paddles);
		const maxScore = Math.max(...paddlesArray.map(p => p.score));
		winners = paddlesArray.filter(p => p.score === maxScore);
	}
	const endMessage = winners.length > 1
		? "Tie: " + winners.map(w => w.name ?? "Unnamed").join(", ")
		: `Game over: ${winners[0]?.name ?? "No one"} won!`;
		
		this.players.forEach((player) => {
			player.ws?.send(JSON.stringify({type: 'gameEnd', data: 
				message ? message : endMessage}))
		});
		this.status = GameStatus.ENDED;
		this.app.prisma.match.update({
			where: { id: this.id },
			data: { status: 'ended' }
		}).catch((err: any) => console.error('Error updating match status:', err));
	}

    private async startGameLoop() {
		await  this.createScene();
		this.status = GameStatus.ONGOING
		let startTime = Date.now();
        let lastTime = Date.now();

		this.paddles = buildScene(this.settings.players + this.settings.aiPlayers!, this.settings.obstacleMode ?? 0, this.scene);
		do {
			this.balls.push(new Ball(this, this.scene));
		} while (this.balls.length < (this.settings.balls ?? 1))
		for (const paddle of this.paddles) paddle.balls = this.balls;
		for (let ball of this.balls) ball.sceneLimit = 20 / (2 * Math.sin(Math.PI / (this.settings.players + this.settings.aiPlayers!)));
		this.players.forEach((player) => {
			const paddle = this.paddles.find(p => !p.player);
			if (paddle) {
				paddle.player = player;
				player.paddle = paddle;
			}
		});
		
		for (let i = 0; i < (this.settings.teams ?? []).length; i++)
			this.createTeam(this.settings.teams![i], i + 1);

		for (let i = 1; i < (this.teams ?? []).length + 1; i++) {
			const r = (i & 1) ? 1 : 0;
			const g = (i & 4) ? 1 : 0;
			const b = (i & 2) ? 1 : 0;
			const teamColor = new BABYLON.Color3(r, g, b);
			for (const player of this.teams![i - 1]) 
				(player.paddle!.box.material as BABYLON.StandardMaterial).diffuseColor = teamColor;
		}
		
		let coms = 1;
		for (const paddle of this.paddles) {
			paddle.player ? paddle.name = paddle.player.name : paddle.name = "COM" + coms++;
			if (this.settings.startScore) paddle.addPoints(this.settings.startScore);
		}

		for (let player of this.players.values()) this.sendScene(player.ws);
		await this.updateScore();

        let frameCount = 0;
		setInterval(() => {
            const now = Date.now();
			if (this.settings.timeLimit && this.status == GameStatus.ONGOING 
				&& now - startTime > this.settings.timeLimit)
				this.gameEnd();
            const deltaTime = (now - lastTime) / 1000;
			this.timePassed += deltaTime;
            lastTime = now;
            if (this.status == GameStatus.ONGOING) {
				for (const ball of this.balls) ball.step();
				this.scene.getPhysicsEngine()?._step(deltaTime);
				for (const paddle of this.paddles) {
					if (frameCount % (10 - this.settings.aiLevel!) == 0)
						paddle.defend();
					paddle.checkBounds();
				}
				this.broadcastSceneState();
			} else if (this.status == GameStatus.PAUSED)
				startTime += deltaTime;
			frameCount++;
        }, 1000 / 30);
    }

	public dispose() {
		this.scene.dispose();
	}
}