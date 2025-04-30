/// <reference types="babylonjs"/>
/// <reference types="babylonjs-gui"/>
import State from "../services/state";

const assetPath = "../assets/"

let keys = {
	up: false,
	down: false,
	left: false,
	right: false,
	w: false,
	s: false,
	a: false,
	d: false,
	r: false
}

type GameMessage = {
    type: string;
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

type GameSettings = {
	players: number;
	aiPlayers?: number;
	timeLimit?: number;
	teams?: string[][];
	balls?: number
}

const loadingScreenDiv = document.createElement("div");
loadingScreenDiv.id = "loadingScreenDiv";
loadingScreenDiv.innerHTML = `
  <div id="loadingContent">
    <img src="${assetPath}PongJamLogo.png" id="loadingImage">
	<img src="${assetPath}transparent_pong.gif" id="loadingGif">
    <p id="loadingText">Connecting...</p>
  </div>`;
document.body.appendChild(loadingScreenDiv);

class Game {
	engine: BABYLON.Engine;
	scene: BABYLON.Scene | undefined;
	camera!: BABYLON.ArcRotateCamera;
	gui!: BABYLON.GUI.AdvancedDynamicTexture;
	lights: BABYLON.PointLight[] = [];
	timer!: BABYLON.GUI.TextBlock;
	settings!: GameSettings;
	ws!: WebSocket;
	canvas: HTMLCanvasElement; 
	textures!: BABYLON.Texture[];
	players!: number;
	scoreBoard: Map<string, BABYLON.GUI.TextBlock> = new Map();
	spectatorMode: boolean = false;

	constructor() {
		this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
		this.engine = new BABYLON.Engine(this.canvas, true);
		const token = localStorage.getItem('authToken');
		const user = localStorage.getItem('currentUser');
		const userName = State.getState().getCurrentUser()?.name;
		if (!token || !user || !userName) {
			console.error('No authentication token or username found');
			window.location.href = '/login';
			return;
		}
		this.ws = new WebSocket(`/match/game?token=${token}&userName=${userName}`, 'wss');
		this.connectWebSocket();
	}

	private async createScene(sceneString: string) {
		this.scene?.dispose();
		this.scene = await BABYLON.LoadSceneAsync("data:" + sceneString, this.engine);
		this.engine.hideLoadingUI();
		this.scene.executeWhenReady(() => {
			loadingScreenDiv.style.display = "none";
		});

		const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 0), this.scene);
    	light.intensity = 1.5;
		this.scene.clearColor = new BABYLON.Color4(0, 0, 0.1, 1);

		for(let i = 0; i < (this.settings.balls ?? 1); i++) {
			const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 0, 0), this.scene);
			pointLight.intensity = 0.7;
			pointLight.range = 10;
			pointLight.diffuse = new BABYLON.Color3(1, 1, 1);
			this.lights.push(pointLight);
		}
		
		this.players = this.settings.players + (this.settings.aiPlayers ?? 0);

		this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
			2.5 * 20 / (2 * Math.sin(Math.PI / this.players || 1)), BABYLON.Vector3.Zero(), this.scene);
		this.camera.attachControl(this.canvas, true);
		this.camera.inputs.remove(this.camera.inputs.attached.keyboard);

		const ballMaterial = new BABYLON.StandardMaterial("ballMat", this.scene);
		ballMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);

		const trailMat = new BABYLON.StandardMaterial("sourceMat", this.scene);
		trailMat.emissiveColor = trailMat.diffuseColor = BABYLON.Color3.White();
		trailMat.specularColor = BABYLON.Color3.Black();
		trailMat.disableLighting = true;
		
		var dome = new BABYLON.PhotoDome(
			"testdome",
			assetPath + "space.jpg",
			{
				resolution: 32,
				size: 3000
			},
			this.scene
		);

		this.scene.meshes.filter(p => p.name.includes("wall")).
		forEach(wall => (wall.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5));
		
		const balls = this.scene.meshes.filter(mesh => mesh.name.includes("ball"));
		for (let i = 0; i < balls.length; i++) {
			const ball = balls[i];
			ball.material = ballMaterial;
			const trail = new BABYLON.TrailMesh("new", ball, this.scene, 0.12, 45, true);
			trail.material = trailMat;

			this.scene.onBeforeRenderObservable.add(() => {
				if (ball && ball.position && BABYLON.Vector3.Distance(ball.position, BABYLON.Vector3.Zero()) < 0.1) {
					trail.reset();
				}
			});
		}
		
		const startTime = Date.now();
		this.scene.registerBeforeRender(() => {
			dome.mesh.rotation.y -= 0.0003;

			if (this.settings.timeLimit && this.timer && !this.ws.CLOSED) {
				let remainingMs = this.settings.timeLimit - (Date.now() - startTime);
				if (remainingMs > 0) {
					const totalSeconds = Math.floor(remainingMs / 1000);
					const minutes = Math.floor(totalSeconds / 60);
					const seconds = totalSeconds % 60;
			
					this.timer.text = `${minutes}:${seconds.toString().padStart(2, '0')}`;
				} else {
					this.timer.text = "0:00";
				}
			}	

			if (!this.spectatorMode) {
				if (keys.w) {
					this.ws.send(JSON.stringify({type: 'moveUp', data: 0}));
					console.log(Date.now());
				}
				else if (keys.s) this.ws.send(JSON.stringify({type: 'moveDown', data: 0}));
				
				if (keys.a) this.ws.send(JSON.stringify({type: 'turnLeft', data: 0}));
				else if (keys.d) this.ws.send(JSON.stringify({type: 'turnRight', data: 0}));

				if (keys.up) this.ws.send(JSON.stringify({type: 'moveUp', data: 1}));
				else if (keys.down) this.ws.send(JSON.stringify({type: 'moveDown', data: 1}));

				if (keys.left) this.ws.send(JSON.stringify({type: 'turnLeft', data: 1}));
				else if (keys.right) this.ws.send(JSON.stringify({type: 'turnRight', data: 1}));
			}
	  
			if (keys.r) this.resetCamera();
	  
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
					this.createUI(message.data.players as string[], message.data.teams as string[][]);
					break;
				case 'score':
					this.updateScore(message.data as object);
					break;
				case 'gameEnd':
					this.gameEnd(message.data as string);
					break;
				case 'settings': this.settings = message.data as GameSettings;
					break;
				case 'spectator': this.spectatorMode = true;
					break;
				case 'connectionDenied': document.getElementById("loadingText")!.innerText = 
					"Connection denied: " + message.data as string;
					document.getElementById("loadingGif")!.style.display = "none";
					break;
			}
		};

		this.ws.onerror = (error) => {
			console.error('WebSocket Error:', error);
		};

		this.ws.onclose = () => {
			console.log('Disconnected from game server');
			document.getElementById("loadingText")!.innerText = "Disconnected from game server";
			document.getElementById("loadingGif")!.style.display = "none";
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

			const balls = data.positions.filter(p => p.id.includes("ball"));
			for (let i = 0; i < balls.length; i++) {
				this.lights[i].position.copyFrom(balls[i].position);
				this.lights[i].position._z = -1;
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

	createUI(playerList: string[], teams?: string[][]) {
		let playerCount = playerList?.length;
		if (!playerCount) playerCount = 1;
		else if (playerCount > this.settings?.players) playerCount = this.settings.players;
		document.getElementById("loadingText")!.innerText = 
		`Waiting for players... (${playerCount}/${this.settings?.players ?? '?'})`;
		if (!this.scene?.getEngine()) return;
		this.gui?.dispose();
		this.gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true);
	
		const container = new BABYLON.GUI.Rectangle();
		container.width = "100%";
		container.height = "60px";
		container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
		container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		container.thickness = 0;
		this.gui.addControl(container);

		if (this.settings.timeLimit && this.settings.timeLimit > 0) {
			const timerText = new BABYLON.GUI.TextBlock();
			timerText.fontSize = 26;
			timerText.color = "white";
			timerText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
			timerText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
			timerText.top = "20px";
			timerText.left = "20px";
			container.addControl(timerText);
			this.timer = timerText;
		}
	
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
			//console.log(teams![0] + ", " + player);
			if (teams && teams[0]?.includes(player)) playerText.color = "red";
			else if (teams && teams[1]?.includes(player)) playerText.color = "blue";
			else if (teams && teams[2]?.includes(player)) playerText.color = "magenta";
			else if (teams && teams[3]?.includes(player)) playerText.color = "green";
			else if (teams && teams[4]?.includes(player)) playerText.color = "yellow";
			else if (teams && teams[5]?.includes(player)) playerText.color = "teal";
			else playerText.color = "white";
			playerText.fontSize = 24;
			playerText.fontStyle = "bold";
			playerText.resizeToFit = true;
			playerText.text = `${player}: ${0}`;
			stackPanel.addControl(playerText);
			this.scoreBoard.set(player, playerText);
		}
	}

	async gameEnd(message: string) {
		const text = new BABYLON.GUI.TextBlock();
		text.text = message;
		text.fontSize = "72px";
		text.color = "silver";
		text.outlineColor = "black";
		text.fontStyle = "bold";
		text.fontFamily = "Arial Black";
		text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		text.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
		text.shadowOffsetX = 4;
		text.shadowOffsetY = 4;
		text.shadowBlur = 8;
		text.shadowColor = "black";
		this.gui.addControl(text);
	}
}

window.addEventListener('DOMContentLoaded', async function() {
	let game = new Game();

	window.addEventListener("keydown", function(e) {
		if (e.key === "ArrowUp" || e.key === "Up") keys.up = true;
		if (e.key === "ArrowDown" || e.key === "Down") keys.down = true;
		if (e.key === "w" || e.key === "W") keys.w = true;
		if (e.key === "s" || e.key === "S") keys.s = true;
		if (e.key === "a" || e.key === "A") keys.a = true;
		if (e.key === "d" || e.key === "D") keys.d = true;
		if (e.key === "r" || e.key === "R") keys.r = true;
		if (e.key === "ArrowUp" || e.key === "Up") keys.up = true;
		if (e.key === "ArrowDown" || e.key === "Down") keys.down = true;
		if (e.key === "ArrowLeft" || e.key === "Left") keys.left = true;
		if (e.key === "ArrowRight" || e.key === "Right") keys.right = true;
	});

	window.addEventListener("keyup", function(e) {
		if (e.key === "ArrowUp" || e.key === "Up") { 
			keys.up = false;
			game.ws.send(JSON.stringify({type: 'stopMoving', data: 1}))
		}
		if (e.key === "ArrowDown" || e.key === "Down") {
			keys.down = false; 
			game.ws.send(JSON.stringify({type: 'stopMoving', data: 1}));
		}
		if (e.key === "ArrowLeft" || e.key === "Left") {
			keys.left = false;
			game.ws.send(JSON.stringify({type: 'stopTurning', data: 1}));
		}
		if (e.key === "ArrowRight" || e.key === "Right") {
			keys.right = false;
			game.ws.send(JSON.stringify({type: 'stopTurning', data: 1}));
		}
		if (e.key === "w" || e.key === "W") {
			keys.w = false;
			console.log(e.key);
			game.ws.send(JSON.stringify({type: 'stopMoving', data: 0}));
		}
		if (e.key === "s" || e.key === "S") {
			keys.s = false;
			game.ws.send(JSON.stringify({type: 'stopMoving', data: 0}));
		}
		if (e.key === "a" || e.key === "A") { 
			keys.a = false;
			game.ws.send(JSON.stringify({type: 'stopTurning', data: 0}));
		}
		if (e.key === "d" || e.key === "D") {
			keys.d = false;
			game.ws.send(JSON.stringify({type: 'stopTurning', data: 0}));
		}
		if (e.key === "r" || e.key === "R") keys.r = false;
	});

	window.addEventListener('resize', function() {
		game.engine?.resize();
	});
});
