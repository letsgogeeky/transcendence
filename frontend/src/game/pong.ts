/// <reference types="babylonjs"/>
/// <reference types="babylonjs-gui"/>

let sideLength = 20;

interface Window {
	timePassed: number;
	scoreString: string;
	game: Game;
}

interface Keys {
  up: boolean;
  down: boolean;
  w: boolean;
  s: boolean;
  q: boolean;
  e: boolean;
  r: boolean;
}

let keys: Keys = {
	up: false,
	down: false,
	w: false,
	s: false,
	q: false,
	e: false,
	r: false
};

let waitText: HTMLDivElement;

class Game {
	engine: BABYLON.Engine;
	scene!: BABYLON.Scene;
	camera!: BABYLON.ArcRotateCamera;
	ws: WebSocket;
	canvas: HTMLCanvasElement; 
	textures: BABYLON.Texture[];
	players!: number;

	constructor() {
		this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		this.textures = [
			// new BABYLON.Texture("src/game/ball.png"),
			// new BABYLON.Texture("src/game/particle.png")
		]
		this.engine = new BABYLON.Engine(this.canvas, true);
		this.ws = new WebSocket('wss://localhost:8082');
		this.connectWebSocket();
	}

	private async createScene(data: string) {
		this.scene = await BABYLON.LoadSceneAsync("data:" + data, this.engine);

		const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    	light.intensity = 0.7;
		this.scene.clearColor = new BABYLON.Color4(0, 0, 0.1, 1);

		this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
			2.5 * sideLength / (2 * Math.sin(Math.PI / /*sides*/2)), BABYLON.Vector3.Zero(), this.scene);
		this.camera.attachControl(this.canvas, true);

		// const ballMaterial = new BABYLON.StandardMaterial("ballMat", this.scene);
		// ballMaterial.diffuseTexture = this.textures[0];
		// ballMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);

		// this.scene.getMeshByName("ball")!.material = ballMaterial;

		this.players = this.scene.meshes.filter(mesh => mesh.name.includes("paddle")).length;

		console.log(this.players);

		this.scene.registerBeforeRender(() => {	
			if (keys.up || keys.w) this.ws.send('moveUp');
			else if (keys.down || keys.s) this.ws.send('moveDown');
			
			// if (keys.q) window.playerPaddle.turnLeft();
			// else if (keys.e) window.playerPaddle.turnRight();
			// else window.playerPaddle.stopTurning();
	  
			if (keys.r) window.game.resetCamera();
	  
			window.timePassed += window.game.engine.getDeltaTime();
		  });

		if (this.players > 1) {
			this.engine.runRenderLoop(() => {
				this.scene.render();
			});
		} else 
			window.alert("Waiting for other players...");
	}

	resetCamera() {
		this.camera!.alpha = Math.PI / 2;
		this.camera!.beta = Math.PI / 2;
	}

	connectWebSocket() {

		this.ws.onopen = () => {
			console.log('Connected to game server');
			this.ws.send('requestScene');
		};

		this.ws.onmessage = async (event) => {
			const message = JSON.parse(event.data);
			switch(message.type) {
				case 'scene':
					await this.createScene(message.data);
					break;
				case 'sceneState':
					this.updateMeshes(message.data);
					break;
			}
		};

		this.ws.onerror = (error) => {
			console.error('WebSocket Error:', error);
		};

		this.ws.onclose = () => {
			console.log('Disconnected from game server');
		};

	}

	updateMeshes(data: string) {
		if (this.scene) {
			const meshUpdates = JSON.parse(data);
			for (const m of meshUpdates) {
				try {
					this.scene.getMeshById(m.id)!.position = m.position;
				} catch (error) {
					console.error('Failed to update mesh:', error);
				}	
			} 
		}
	}
}


window.addEventListener('DOMContentLoaded', async function() {

	window.timePassed = 0;

	window.game = new Game();

	window.addEventListener("keydown", function(e) {
		if (e.key === "ArrowUp" || e.key === "Up") keys.up = true;
		if (e.key === "ArrowDown" || e.key === "Down") keys.down = true;
		if (e.key === "w" || e.key === "W") keys.w = true;
		if (e.key === "s" || e.key === "S") keys.s = true;
		if (e.key === "q" || e.key === "Q") keys.q = true;
		if (e.key === "e" || e.key === "E") keys.e = true;
		if (e.key === "r" || e.key === "R") keys.r = true;
	});

	window.addEventListener("keyup", function(e) {
		if (e.key === "ArrowUp" || e.key === "Up") keys.up = false;
		if (e.key === "ArrowDown" || e.key === "Down") keys.down = false;
		if (e.key === "w" || e.key === "W") keys.w = false;
		if (e.key === "s" || e.key === "S") keys.s = false;
		if (e.key === "q" || e.key === "Q") keys.q = false;
		if (e.key === "e" || e.key === "E") keys.e = false;
		if (e.key === "r" || e.key === "R") keys.r = false;
	});

	window.addEventListener('resize', function() {
	if (this.window.game.engine)
		window.game.engine.resize();
	});
});
