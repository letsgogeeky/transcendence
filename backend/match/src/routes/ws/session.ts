import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Paddle } from './paddle.js'
import { buildScene } from './scene.js';
import { Ball } from './ball.js';
import { WebSocket } from "ws";
import { paddleAi } from './paddleAi.js'

export async function loadPhysics() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	const wasmPath = join(__dirname, '../../../node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm');
    const wasmBinary = readFileSync(wasmPath);
    const havokInstance = await HavokPhysics({ wasmBinary });
    return havokInstance;
}

export type GameSettings = {
	players: number;
	aiPlayers?: number;
	timeLimit?: number;
	startScore?: number,
	winScore?: number;
	replaceDisconnected?: boolean;
	terminatePlayers?: boolean;
	//teams:
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
    clients = new Set<WebSocket>();
	paddles: Paddle[] = [];
	balls: Ball[] = [];
	status: GameStatus = GameStatus.WAITING;
	settings: GameSettings;
	id: string;

    constructor(matchId: string, settings: GameSettings) {
		this.id = matchId;
		this.settings = settings;
		if (settings.aiPlayers == undefined) settings.aiPlayers = 0;
        this.createScene();
    }

    private async createScene() {
        this.engine = new BABYLON.NullEngine();
        this.scene = new BABYLON.Scene(this.engine);
        const havokInstance = await loadPhysics();
        const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
		this.scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), havokPlugin);

		if (this.settings.players == 0) this.startGameLoop();
    }

	public handleConnection(ws: WebSocket) {
		this.clients.add(ws);
		if (this.status == GameStatus.WAITING && this.clients.size == this.settings.players) {
			this.startGameLoop();
			for (let client of this.clients) this.sendScene(client);
			this.updateScore();
		}
		else if (this.clients.size > this.settings.players) {
			ws.send(JSON.stringify({type: 'spectator'}));
			this.sendScene(ws);
		}
		ws.send(JSON.stringify({type: 'settings', data: this.settings}));
		this.sendPlayerList(ws);
    }

    public handleMessage(ws: WebSocket, message: string) {
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'moveUp': this.paddles.find(p => p.ws === ws)?.moveUp(); break;
                case 'moveDown': this.paddles.find(p => p.ws === ws)?.moveDown(); break;
            }
        } catch (e) {
            console.error('Invalid message:', message);
        }
    }

    public handleClose(ws: WebSocket) {
        if (this.status == GameStatus.ONGOING) {
			const disconnectedPlayer = this.paddles.find(p => p.ws === ws);
			if (this.settings.replaceDisconnected && disconnectedPlayer)
				 disconnectedPlayer.player = false;
			else this.gameEnd("Lost connection to player");
		}
		this.clients.delete(ws);
    }

	public sendPlayerList(client: WebSocket) {
		const playerNames = [];
		for (const paddle of this.paddles) playerNames.push(paddle.name);
		client.send(JSON.stringify({type: 'playerList', data: playerNames}));
	}

	public sendScene(client: WebSocket) {
		const sceneString = JSON.stringify(BABYLON.SceneSerializer.Serialize(this.scene));
		client.send(JSON.stringify({type: 'scene', data: sceneString}));
		this.sendPlayerList(client);
	}

	public updateScore() {
		const scoreMap = new Map<string, number>();
		this.paddles.forEach(player => {
			scoreMap.set(player.name, player.score);
		});
		for (const client of this.clients) 
			client.send(JSON.stringify({type: 'score', data: Object.fromEntries(scoreMap)}));
		let removePaddle;
		for (const paddle of this.paddles) {
			if (this.settings.winScore && paddle.score >= this.settings.winScore)
				this.gameEnd("highest score");
			else if (paddle.score <= 0 && this.settings.terminatePlayers)
				removePaddle = paddle;
		}
		if (removePaddle) {
			this.paddles = this.paddles.filter(p => p != removePaddle);
			if (this.paddles.length <= 1) this.gameEnd("termination");
		}
	}

    private broadcastSceneState() {
		const paddlePositions = this.paddles.map(paddle => ({position: paddle.box.position, id: paddle.box.id}));
		const ballPositions = this.balls.map(ball => ({position: ball.position, id: ball.ball.id}));
		const meshPositions = [...paddlePositions, ...ballPositions];
		const meshRotations = this.balls.map(ball => ({rotation: ball.aggregate.transformNode.rotationQuaternion, id: ball.ball.id}));
		this.clients.forEach((client) => {
		    client.send(JSON.stringify({type: 'sceneState', data: {positions: meshPositions, rotations: meshRotations}}));
		});
    }

	private gameEnd(message?: string) {
		const winner = this.paddles.reduce((max, current) =>
			current.score > max.score ? current : max
		);
		this.clients.forEach((client) => {
			client.send(JSON.stringify({type: 'gameEnd', data: 
				message ? message : `Game ended. ${winner.name} won!`}))
		});
		this.status = GameStatus.ENDED;
	}

    private startGameLoop() {
		this.status = GameStatus.ONGOING
		let startTime = Date.now();
        let lastTime = Date.now();

		this.paddles = buildScene(this.settings.players + this.settings.aiPlayers!, this.scene);
		this.balls.push(new Ball(this, this.scene));
		for (const paddle of this.paddles) paddle.balls = this.balls;
		for (let ball of this.balls) ball.sceneLimit = 20 / (2 * Math.sin(Math.PI / (this.settings.players + this.settings.aiPlayers!)));
		this.clients.forEach((client) => {
			const paddle = this.paddles.find(p => !p.player);
			if (paddle) {
				paddle.player = true;
				paddle.ws = client;
			}
		})
		let players = 1;
		let coms = 1;
		for (const paddle of this.paddles) {
			paddle.player ? paddle.name = "Player" + players++ : paddle.name = "COM" + coms++;
			if (this.settings.startScore) paddle.score = this.settings.startScore;
		}

        setInterval(() => {
            const now = Date.now();
			if (this.settings.timeLimit && this.status == GameStatus.ONGOING 
				&& now - startTime > this.settings.timeLimit)
				this.gameEnd();
            const deltaTime = (now - lastTime) / 1000;
            lastTime = now;
            if (this.status == GameStatus.ONGOING) {
				this.scene.getPhysicsEngine()?._step(deltaTime);
				for (const paddle of this.paddles) paddle.defend();
				//for (const paddle of this.paddles) paddle.moveToTarget();
				for (const ball of this.balls) ball.step();
				this.broadcastSceneState();
			} else if (this.status == GameStatus.PAUSED)
				startTime += deltaTime;
        }, 1000 / 30);
		// setInterval(() => {
		// 	paddleAi(this.paddles, this.balls);
		// }, 1000);
    }

	public dispose() {
		this.scene.dispose();
	}
}