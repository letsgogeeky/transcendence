/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />

import { createStage, walls, paddles, resetCamera } from './stage';
import { Paddle } from './paddle';
import { Ball } from './ball';

declare const HavokPhysics: any;

declare global {
	interface Window {
		createScene: () => Promise<BABYLON.Scene>;
		pause: boolean;
		timePassed: number;
		balls: Ball[];
		playerPaddle: Paddle;
		paddles: Paddle[];
		radius: number;
		scoreString: string;
	}
}

const pauseText = document.createElement('div');
pauseText.id = 'pauseText';
pauseText.innerText = 'Paused';

interface Keys {
  up: boolean;
  down: boolean;
  w: boolean;
  s: boolean;
  q: boolean;
  e: boolean;
  r: boolean;
}

window.addEventListener('DOMContentLoaded', async function() {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const engine = new BABYLON.Engine(canvas, true);

  window.pause = false;

  const keys: Keys = {
    up: false,
    down: false,
    w: false,
    s: false,
	q: false,
	e: false,
	r: false
  };

  window.createScene = async function(): Promise<BABYLON.Scene> {
    window.timePassed = 0;
    const scene = new BABYLON.Scene(engine);

    scene.clearColor = new BABYLON.Color4(0, 0, 0.1, 1);
    const havokInstance = await HavokPhysics();
    const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);

    scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), havokPlugin);

    createStage(scene, canvas);
    window.playerPaddle = paddles[0];
	window.paddles = paddles;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

	window.balls = [];
	window.balls.push(new Ball(scene));


    window.addEventListener("keydown", function(e) {
      if (e.key === "ArrowUp" || e.key === "Up") keys.up = true;
      if (e.key === "ArrowDown" || e.key === "Down") keys.down = true;
      if (e.key === "w" || e.key === "W") keys.w = true;
      if (e.key === "s" || e.key === "S") keys.s = true;
	  if (e.key === "q" || e.key === "Q") keys.q = true;
	  if (e.key === "e" || e.key === "E") keys.e = true;
	  if (e.key === "r" || e.key === "R") keys.r = true;
      if (e.key === "p" || e.key === "P") {
        if (!window.pause) {
          document.body.appendChild(pauseText);
          scene.physicsEnabled = false;
        } else {
          pauseText.remove();
          scene.physicsEnabled = true;
        }
        window.pause = !window.pause;
      }
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

    scene.registerBeforeRender(function() {
      if (window.pause) return;

      if (keys.up || keys.w) window.playerPaddle.moveUp();
      else if (keys.down || keys.s) window.playerPaddle.moveDown();
      else window.playerPaddle.stopMoving();
      
	  if (keys.q) window.playerPaddle.turnLeft();
	  else if (keys.e) window.playerPaddle.turnRight();
	  else window.playerPaddle.stopTurning();

	  if (keys.r) resetCamera();

      for (let paddle of paddles) paddle.defend(window.balls);

      window.timePassed += engine.getDeltaTime();
    });

    return scene;
  }

  const scene = await window.createScene();
  engine.runRenderLoop(function() {
    scene.render();
  });

  window.addEventListener('resize', function() {
    engine.resize();
  });
});
