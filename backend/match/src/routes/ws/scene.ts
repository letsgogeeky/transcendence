import { Paddle } from './paddle.js';
import * as BABYLON from '@babylonjs/core';

let sides: number = 2;
let sideLength: number = 20;
let polygon: BABYLON.Mesh;
let walls: BABYLON.Mesh[] = [];
let paddleBoxes: BABYLON.Mesh[] = [];
let paddles: Paddle[];
let obstacles: BABYLON.Mesh[] = [];

function createShape(sides: number, sideLength: number, mode: number, scene: BABYLON.Scene): void {
  const points = getRegularPolygonPoints(sides, sideLength);
  if (polygon !== undefined) polygon.dispose();

  walls.length = 0;
  paddles.length = 0;
  paddleBoxes.length = 0;

  if (sides != 2) {
    for (let i = 0; i < points.length; i++) {
      const wall1 = BABYLON.MeshBuilder.CreateBox("wall", { height: sideLength / 4 }, scene);
      const wall2 = BABYLON.MeshBuilder.CreateBox("wall", { height: sideLength / 4 }, scene);
      wall1.position = points[i];
      wall2.position = points[i];
      wall1.lookAt(points.at(i - 1)!, 0, Math.PI / 2, 0);
      wall2.lookAt(points.at(i !== points.length - 1 ? (i + 1) : 0)!, 0, Math.PI / 2, 0);
      wall1.locallyTranslate(new BABYLON.Vector3(0, wall1.scaling.y * 2, 0));
      wall2.locallyTranslate(new BABYLON.Vector3(0, wall2.scaling.y * 2, 0));
	  wall2.position.z += 0.01;
      const paddle = wall1.clone("paddle" + i);
      paddle.locallyTranslate(new BABYLON.Vector3(0, paddle.scaling.y * 8, 0));
      paddle.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

      walls.push(wall1);
      walls.push(wall2);
      paddleBoxes.push(paddle);
    }
  } else {
	const wallLength = sideLength * 1.5;
    const wall1 = BABYLON.MeshBuilder.CreateBox("wall", { height: wallLength }, scene);
    const wall2 = BABYLON.MeshBuilder.CreateBox("wall", { height: wallLength }, scene);
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
}

	if (mode == 1) {
		obstacles.push(BABYLON.MeshBuilder.CreateBox("", { width: 2.5, height: 2.5}, scene)) 
		obstacles[0].rotation.z = Math.PI / 4;
		obstacles[0].position.x = -6;
		obstacles.push(obstacles[0].clone(""));
		obstacles[1].position.x = 6;
		for (const o of obstacles)
			new BABYLON.PhysicsAggregate(o, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
	}
	else if (mode == 2) {
		obstacles.push(BABYLON.MeshBuilder.CreateCylinder("", {diameter: 5, height: 1, tessellation: 3}));
		obstacles[0].position.y = -6;
		obstacles[0].rotate(BABYLON.Axis.Y, Math.PI / 2, BABYLON.Space.WORLD);
		obstacles[0].rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.WORLD);
		obstacles[0].scaling.z = 3;
		obstacles.push(obstacles[0].clone(""));
		obstacles[1].rotate(BABYLON.Axis.Z, Math.PI, BABYLON.Space.WORLD);
		obstacles[1].position.y = 6;
		for (const o of obstacles) {
			o.computeWorldMatrix(true);
			o.refreshBoundingInfo();
			new BABYLON.PhysicsAggregate(o, BABYLON.PhysicsShapeType.MESH, { mass: 0 }, scene);
		}
	}
	else if (mode == 3) {
		const start = new BABYLON.Vector3(-10, 5, 0);
		for (let i = 0; i < 10; i +=2) {
			for (let j = 0; j < 20; j += 2) {
				const box = BABYLON.MeshBuilder.CreateBox(("" + i) + j, {}, scene);
				box.position = start.clone().addInPlace(new BABYLON.Vector3(j, -i, 0));
				const aggregate = new BABYLON.PhysicsAggregate(box, BABYLON.PhysicsShapeType.MESH, { mass: 1 }, scene);
				obstacles.push(box);
			}
		}
	}
	points.push(points[0]);
	polygon = BABYLON.MeshBuilder.CreateLines("polygon", { points }, scene);

	const paddleMaterial = new BABYLON.StandardMaterial("paddleMat", scene);
	paddleMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
	for (let i = 0; i < paddleBoxes.length; i++) paddles.push(new Paddle(paddleBoxes[i], paddleMaterial, 
		paddleBoxes.length > 2, scene));
	if (sides == 2) for (let p of paddles) p.limit *= 1.175;

	for (let wall of walls) new BABYLON.PhysicsAggregate(wall, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0 }, scene);
}

export function findPolygonSide(pos: BABYLON.Vector3): number {
    let angle = Math.atan2(pos.x, -pos.y) + Math.PI;
    return sides == 2 ? (pos.x < 0 ? 1 : 0) : Math.floor((angle / (2 * Math.PI)) * sides);
}

function getRegularPolygonPoints(n: number, sideLength: number): BABYLON.Vector3[] {
  const points: BABYLON.Vector3[] = [];
  const angleStep = (2 * Math.PI) / n;
  const radius = sideLength / (2 * Math.sin(Math.PI / n));

  for (let i = 0; i < n; i++) {
    const x = radius * Math.sin(i * angleStep);
    const y = radius * Math.cos(i * angleStep);
    points.push(new BABYLON.Vector3(x, y, 0));
  }

  return points;
}

export const buildScene = function(players: number, mode: number, scene: BABYLON.Scene): any {
	sides = players;
	paddles = [];
	obstacles = [];
  	createShape(sides, sideLength, mode, scene);
	return {paddles: paddles, obstacles: obstacles};
}
