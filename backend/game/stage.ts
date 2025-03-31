import { Paddle } from './paddle.ts';
import { Ball } from './ball.ts';
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';

let sides: number = 2;
let sideLength: number = 20;
let ballNumber: number = 1;
export let polygon: BABYLON.Mesh | undefined;
export let walls: BABYLON.Mesh[] = [];
export let paddleBoxes: BABYLON.Mesh[] = [];
export let paddles: Paddle[] = [];
let camera: BABYLON.ArcRotateCamera;

function createShape(sides: number, sideLength: number, scene: BABYLON.Scene): void {
  const points = getRegularPolygonPoints(sides, sideLength);
  if (polygon !== undefined) polygon.dispose();

  for (let w of walls) w.dispose();
  for (let p of paddles) p.dispose();
  for (let p of paddleBoxes) p.dispose();
  walls.length = 0;
  paddles.length = 0;
  paddleBoxes.length = 0;

  if (sides !== 2) {
    for (let i = 0; i < points.length; i++) {
      const wall1 = BABYLON.MeshBuilder.CreateBox("wall" + i * 2, { height: sideLength / 4 }, scene);
      const wall2 = BABYLON.MeshBuilder.CreateBox("wall" + i * 2 + 1, { height: sideLength / 4 }, scene);
      wall1.position = points[i];
      wall2.position = points[i];
      wall1.lookAt(points.at(i - 1)!, 0, Math.PI / 2, 0);
      wall2.lookAt(points.at(i !== points.length - 1 ? (i + 1) : 0)!, 0, Math.PI / 2, 0);
      wall1.locallyTranslate(new BABYLON.Vector3(0, wall1.scaling.y * 2, 0));
      wall2.locallyTranslate(new BABYLON.Vector3(0, wall2.scaling.y * 2, 0));
      const paddle = wall1.clone("paddle" + i);
      paddle.locallyTranslate(new BABYLON.Vector3(0, paddle.scaling.y * 8, 0));
      paddle.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

      walls.push(wall1);
      walls.push(wall2);
      paddleBoxes.push(paddle);
    }
  } else {
	//camera.radius = sideLength;
	const wallLength = sideLength * 1.5;
    const wall1 = BABYLON.MeshBuilder.CreateBox("wall0", { height: wallLength }, scene);
    const wall2 = BABYLON.MeshBuilder.CreateBox("wall1", { height: wallLength }, scene);
    const paddle1 = wall1.clone("paddle0");
    const paddle2 = wall2.clone("paddle1");
    paddle1.scaling = new BABYLON.Vector3(0.5, 0.125, 0.5);
    paddle2.scaling = new BABYLON.Vector3(0.5, 0.125, 0.5);
    wall1.rotation.z = Math.PI / 2;
    wall2.rotation.z = Math.PI / 2;
    wall1.position.y = (1.25 * sideLength / 4) + 1;
    wall2.position.y = -(1.25 * sideLength / 4) - 1;
    points[0].y = 1.25 * points[0].y / 2 + 1;
    points[1].y = 1.25 * points[1].y / 2 - 1;
    points[0].x = wallLength / 2 - 0.5;
    points[1].x = wallLength / 2 - 0.5;
    points.push(points[1].clone());
    points.push(points[0].clone());
    points[2].x -= wallLength - 1;
    points[3].x -= wallLength - 1;
    paddle1.position.x = points[0].x;
    paddle2.position.x = points[2].x;
	paddle1.rotation.y = -Math.PI / 2;
	paddle2.rotation.y = -Math.PI / 2;
    walls.push(wall1);
    walls.push(wall2);
    paddleBoxes.push(paddle1);
    paddleBoxes.push(paddle2);
	// let obstacle = BABYLON.MeshBuilder.CreateBox("box", { width: 3, height: 3}, scene);
	// obstacle.rotation.z = Math.PI / 4;
	// new BABYLON.PhysicsAggregate(obstacle, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0 }, scene);
  }
  points.push(points[0]);
  polygon = BABYLON.MeshBuilder.CreateLines("polygon", { points }, scene);

  const paddleMaterial = new BABYLON.StandardMaterial("paddleMat", scene);
  paddleMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
  for (let i = 0; i < paddleBoxes.length; i++) paddles.push(new Paddle(paddleBoxes[i], paddleMaterial, i, scene));
  if (sides == 2) for (let p of paddles) p.limit *= 1.175;
  //window.playerPaddle = paddles[0];
  //window.playerPaddle.player = true;

  for (let wall of walls) new BABYLON.PhysicsAggregate(wall, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0 }, scene);

  //updateScore();
}

export function updateScore() {
	// window.scoreString = "Player: " + window.playerPaddle.score + " ";
	// for (let i = 1; i < paddles.length; i++) {
	// 	window.scoreString += "| CPU" + i + ": " + paddles[i].score + " ";
	// } 
	// document.getElementById('scoreDisplay')!.textContent = window.scoreString;
}

export function findPolygonSide(pos: BABYLON.Vector3): number {
    let angle = Math.atan2(pos.x, -pos.y) + Math.PI;
    return sides == 2 ? (pos.x < 0 ? 1 : 0) : Math.floor((angle / (2 * Math.PI)) * sides);
}

function getRegularPolygonPoints(n: number, sideLength: number): BABYLON.Vector3[] {
  const points: BABYLON.Vector3[] = [];
  const angleStep = (2 * Math.PI) / n;
  const radius = sideLength / (2 * Math.sin(Math.PI / n));
  global.radius = radius;

  for (let i = 0; i < n; i++) {
    const x = radius * Math.sin(i * angleStep);
    const y = radius * Math.cos(i * angleStep);
    points.push(new BABYLON.Vector3(x, y, 0));
  }

  return points;
}

export const createStage = function(players: number, scene: BABYLON.Scene): void {
	sides = players;
//   camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2,
//     2.5 * sideLength / (2 * Math.sin(Math.PI / sides)), BABYLON.Vector3.Zero(), scene);
//   camera.attachControl(canvas, true);
//   camera.keysUp = [];
//   camera.keysDown = [];
//   camera.keysLeft = [];
//   camera.keysRight = [];

//   const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

//   const slider = new BABYLON.GUI.Slider();
//   slider.minimum = 2;
//   slider.maximum = 8;
//   slider.value = sides;
//   slider.height = "20px";
//   slider.width = "200px";
//   slider.color = "white";
//   slider.background = "gray";
//   slider.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
//   slider.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
//   slider.left = "20px";
//   slider.top = "40px";
//   slider.onValueChangedObservable.add(function(value) {
//     if (sides !== Math.round(value)) {
// 		camera.radius = 3 * sideLength / (2 * Math.sin(Math.PI / sides));
// 		createShape(Math.round(value), sideLength, scene);
// 		for (let ball of window.balls) ball.reset(false);
// 		sides = Math.round(value);
// 		valueText.text = "Players: " + sides;
// 		window.timePassed = 0;
//     }
//   });
//   advancedTexture.addControl(slider);

//   const valueText = new BABYLON.GUI.TextBlock();
//   valueText.text = "Players: " + sides;
//   valueText.color = "white";
//   valueText.fontSize = 20;
//   valueText.height = "20px";
//   valueText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
//   valueText.left = "-650px";
//   valueText.top = "10px";
//   advancedTexture.addControl(valueText);


//   const ballSlider = new BABYLON.GUI.Slider();
//   ballSlider.minimum = 1;
//   ballSlider.maximum = 5;
//   ballSlider.value = ballNumber;
//   ballSlider.height = "20px";
//   ballSlider.width = "200px";
//   ballSlider.color = "white";
//   ballSlider.background = "gray";
//   ballSlider.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
//   ballSlider.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
//   ballSlider.left = "20px";
//   ballSlider.top = "110px";
//   ballSlider.onValueChangedObservable.add(function(value) {
//     if (ballNumber !== Math.round(value)) {
// 		ballNumber = Math.round(value);
// 		for (let ball of window.balls) ball.dispose();
// 		window.balls.length = 0;
// 		for (let i = 0; i < ballNumber; i++) window.balls.push(new Ball(scene));
// 		ballnoText.text = "Balls: " + ballNumber;
//     }
//   });
//   advancedTexture.addControl(ballSlider);

//   const ballnoText = new BABYLON.GUI.TextBlock();
//   ballnoText.text = "Balls: " + ballNumber;
//   ballnoText.color = "white";
//   ballnoText.fontSize = 20;
//   ballnoText.height = "20px";
//   ballnoText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
//   ballnoText.left = "-650px";
//   ballnoText.top = "80px";
//   advancedTexture.addControl(ballnoText);

  createShape(sides, sideLength, scene);
}

// export function resetCamera() {
// 	camera.alpha = Math.PI / 2;
// 	camera.beta = Math.PI / 2;
// }
