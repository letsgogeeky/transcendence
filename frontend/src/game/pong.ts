/// <reference types="babylonjs"/>
/// <reference types="babylonjs-gui"/>

const messageDiv = document.createElement("div");
messageDiv.innerText = "Waiting for game to start...";
messageDiv.style.position = "fixed";
messageDiv.style.top = "50%";
messageDiv.style.left = "50%";
messageDiv.style.transform = "translate(-50%, -50%)";
messageDiv.style.fontSize = "48px";
messageDiv.style.fontWeight = "bold";
messageDiv.style.color = "#fff";
messageDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
messageDiv.style.padding = "20px 40px";
messageDiv.style.borderRadius = "12px";
messageDiv.style.zIndex = "1000";
messageDiv.style.display = "block";

document.body.appendChild(messageDiv);

interface Window {
	timePassed: number;
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

type GameMessage = {
    type: string;
    match_id: string;
    data: any;
}

type MeshData = {
	positions: {
		position: BABYLON.Vector3;
		id: string;
	}[]
	rotations: {
		rotation: BABYLON.Quaternion;
		id: string;
	}[]
}

class Game {
	engine: BABYLON.Engine;
	scene: BABYLON.Scene | undefined;
	camera!: BABYLON.ArcRotateCamera;
	ws: WebSocket;
	canvas: HTMLCanvasElement; 
	textures!: BABYLON.Texture[];
	players!: number;
	scoreBoard: Map<string, BABYLON.GUI.TextBlock> = new Map();
	spectatorMode: boolean = false;

	constructor() {
		this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		this.engine = new BABYLON.Engine(this.canvas, true);
		this.ws = new WebSocket('wss://localhost:8082/game');
		this.connectWebSocket();
	
		const interval = setInterval(() => {
			if (this.scene) {
				clearInterval(interval);
				messageDiv.style.display = "none";
			}
		  }, 100);
	}

	private async createScene(sceneString: string) {
		this.scene?.dispose();
		this.scene = await BABYLON.LoadSceneAsync("data:" + sceneString, this.engine);

		this.textures = [
			new BABYLON.Texture("src/game/ball.png", this.scene),
			new BABYLON.Texture("src/game/particle.png", this.scene)
		]

		const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    	light.intensity = 0.7;
		this.scene.clearColor = new BABYLON.Color4(0, 0, 0.1, 1);
		
		this.players = this.scene.meshes.filter(mesh => mesh.name.includes("paddle")).length;

		this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
			2.5 * 20 / (2 * Math.sin(Math.PI / this.players)), BABYLON.Vector3.Zero(), this.scene);
		this.camera.attachControl(this.canvas, true);

		const ballMaterial = new BABYLON.StandardMaterial("ballMat", this.scene);
		ballMaterial.diffuseTexture = this.textures[0];
		ballMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
		this.scene.getMeshByName("ball")!.material = ballMaterial;

		this.scene.registerBeforeRender(() => {	
			if (keys.up || keys.w && !this.spectatorMode) this.ws.send(JSON.stringify({type: 'moveUp'}));
			else if (keys.down || keys.s  && !this.spectatorMode) this.ws.send(JSON.stringify({type: 'moveDown'}));
			
			// if (keys.q) window.playerPaddle.turnLeft();
			// else if (keys.e) window.playerPaddle.turnRight();
	  
			if (keys.r) window.game.resetCamera();
	  
			window.timePassed += window.game.engine.getDeltaTime();
		  });

		  this.engine.runRenderLoop(() => {
			  this.scene?.render();
		  });
	}

	resetCamera() {
		this.camera!.alpha = Math.PI / 2;
		this.camera!.beta = Math.PI / 2;
	}

	connectWebSocket() {

		this.ws.onmessage = async (event) => {
			const message = JSON.parse(event.data);
			switch(message.type) {
				case 'scene':
					await this.createScene(message.data as string);
					break;
				case 'sceneState':
					this.updateMeshes(message.data as MeshData);
					break;
				case 'playerList':
					this.createScoreboardUI(message.data as string[]);
					break;
				case 'score':
					this.updateScore(message.data as object);
					break;
				case 'gameEnd':
					window.alert(message.data as string);
					break;
				case 'spectator': this.spectatorMode = true;
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

	updateMeshes(data: MeshData) {
		if (this.scene) {
			for (const p of data.positions) {
				try {
					this.scene.getMeshById(p.id)!.position = p.position;
				} catch (error) {
					console.error('Failed to update mesh:', error);
				}	
			} 
			for (const r of data.rotations) {
				try {
					this.scene.getMeshById(r.id)!.rotationQuaternion = r.rotation;
				} catch (error) {
					console.error('Failed to update mesh:', error);
				}	
			} 
		}
	}

	updateScore(data: object) {
		const playerScores = new Map(Object.entries(data));
		for (const [name, score] of playerScores.entries()) {
			const text = this.scoreBoard.get(name);
			if (text) text.text = `${name}: ${score}`;
		}
	}	

	createScoreboardUI(playerList: string[]) {
		const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true);
	
		const container = new BABYLON.GUI.Rectangle();
		container.width = "100%";
		container.height = "60px";
		container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
		container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		container.thickness = 0;
		gui.addControl(container);
	
		const stackPanel = new BABYLON.GUI.StackPanel();
		stackPanel.isVertical = false;
		stackPanel.height = "100%";
		stackPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		stackPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
		stackPanel.paddingTop = "10px";
		stackPanel.spacing = 20;
		container.addControl(stackPanel);
	
		for (const player of playerList) {
			const playerText = new BABYLON.GUI.TextBlock();
			playerText.color = "white";
			playerText.fontSize = 24;
			playerText.fontStyle = "bold";
			playerText.resizeToFit = true;;
			playerText.text = `${player}: ${0}`;
			stackPanel.addControl(playerText);
			this.scoreBoard.set(player, playerText);
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
		window.game.engine?.resize();
	});
});