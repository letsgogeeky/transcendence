import Fastify from 'fastify';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { createStage, paddles } from './stage.ts';
import { Ball } from './ball.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const wasmPath = join(__dirname, 'node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm');

global.players = 0;

async function loadPhysics() {
    const wasmBinary = readFileSync(wasmPath);
    const havokInstance = await HavokPhysics({ wasmBinary });
    return havokInstance;
}

class GameServer {
    private fastify = Fastify({
		https: {
			key: readFileSync('localhost-key.pem'),
			cert: readFileSync('localhost-cert.pem'),
		},
	});
    private server!: import('http').Server;
    private wss!: WebSocketServer;
    private engine!: BABYLON.NullEngine;
    private scene!: BABYLON.Scene;
    public clients = new Set<WebSocket>();
	private balls: Ball[] = [];

    constructor() {
        this.setupRoutes();
        this.createScene();
        this.setupWebSockets();
        this.startGameLoop();
    }

    private setupRoutes() {
        this.fastify.register(import('@fastify/static'), {
            root: join(__dirname, '.'),
        });

        this.fastify.get('/', async (_, reply) => {
            return reply.sendFile('index.html');
        });
    }

    private async createScene() {
        this.engine = new BABYLON.NullEngine();
        this.scene = new BABYLON.Scene(this.engine);
        const havokInstance = await loadPhysics();
        const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
		this.scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), havokPlugin);

		this.balls.push(new Ball(this.scene));
    }

    private createPlayer(): BABYLON.Mesh {
        const player = BABYLON.MeshBuilder.CreateSphere("player", { diameter: 1 }, this.scene);
        player.position = new BABYLON.Vector3(Math.random() * 10 - 5, 5, Math.random() * 10 - 5);
        new BABYLON.PhysicsAggregate(player, BABYLON.PhysicsShapeType.SPHERE, { mass: 1, restitution: 1.01 }, this.scene);
        return player;
    }

    private setupWebSockets() {
        this.server = this.fastify.server;
        this.wss = new WebSocketServer({ server: this.server });

        this.wss.on('connection', (ws) => {
            console.log('New client connected');
            this.clients.add(ws);
            //this.createPlayer();
			createStage(++global.players, this.scene);
			var i = 0;
			for (const client of this.clients) {
				paddles[i++].ws = client;
				this.sendScene(client);
			}

            ws.on('message', (message) => this.processClientMessage(ws, message.toString()));
            ws.on('close', () => {
                console.log('Client disconnected');
                this.clients.delete(ws);
				global.players--;
            });
        });
    }

    private processClientMessage(ws: WebSocket, message: string) {
        try {
			switch (message) {
				case 'requestScene': this.sendScene(ws);
					break;
				case 'moveUp': paddles.find(paddle => paddle.ws == ws)!.moveUp();
					break;
				case 'moveDown': paddles.find(paddle => paddle.ws == ws)!.moveDown();
					break;
				//case 'stop':  paddles.find(paddle => paddle.ws == ws)!.stopMoving();
			}
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }

    private handlePlayerInput(inputData: { meshId: string; position: { x: number; y: number; z: number } }) {
        const mesh = this.scene.getMeshById(inputData.meshId);
        if (mesh) {
            mesh.position.copyFrom(new BABYLON.Vector3(inputData.position.x, inputData.position.y, inputData.position.z));
        }
    }

	private sendScene(client: WebSocket) {
		const sceneString = JSON.stringify(BABYLON.SceneSerializer.Serialize(this.scene));
		client.send(JSON.stringify({type: 'scene', data: sceneString}));
	}

    private broadcastSceneState() {
        // const serializedMeshes = this.scene.meshes.map(mesh => BABYLON.SceneSerializer.SerializeMesh(mesh));
        // this.clients.forEach((client, index) => {
        //     client.send(JSON.stringify({ name: `player${index}`, type: 'sceneState', data: JSON.stringify(serializedMeshes) }));
        // });
		const meshPositions = this.scene.meshes.map(mesh => ({position: mesh.position, id: mesh.id}));
		this.clients.forEach((client) => {
		    client.send(JSON.stringify({type: 'sceneState', data: JSON.stringify(meshPositions)}));
		});
    }

    private startGameLoop() {
        let lastTime = Date.now();
		let frame = 0;
        setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000;
            lastTime = now;
            if (this.scene.getPhysicsEngine()) {
                this.scene.getPhysicsEngine()!._step(deltaTime);
            }
			if (frame % 2 == 0)
				for (const paddle of paddles) paddle.defend(this.balls);
            this.broadcastSceneState();
			// if (this.balls.length > 0)
			// 	console.log(this.balls[0].ball.position);
			for (const ball of this.balls) ball.step();
			frame++;
        }, 1000 / 30);
    }

    public async start() {
        try {
            await this.fastify.listen({ port: 8082, host: '0.0.0.0' });
            console.log('WSS server running on port 8082 with HTTPS');
        } catch (error) {
            console.error('Error starting server:', error);
            process.exit(1);
        }
    }

}

const gameServer = new GameServer();
gameServer.start();