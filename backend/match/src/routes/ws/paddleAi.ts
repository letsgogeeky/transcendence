import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Ball } from './ball.js';
import { Paddle } from './paddle.js';

type TrajectoryPoint = {
	position: BABYLON.Vector3;
	direction: BABYLON.Vector3;
	time: number;
};

function cloneBall(original: BABYLON.PhysicsAggregate, scene: BABYLON.Scene): BABYLON.PhysicsAggregate {
	let mesh = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.8 }, scene);
	const aggregate = new BABYLON.PhysicsAggregate(mesh, original?.shape?.type, {
		mass: 1,
		restitution: 1,
	}, scene);
	mesh.position.copyFrom(original?.transformNode?.position);
	aggregate.body?.setLinearVelocity(original?.body?.getLinearVelocity()?.clone());
	aggregate.body?.setAngularVelocity(original?.body?.getAngularVelocity()?.clone());
	
	return aggregate;
}

function cloneMesh(original: BABYLON.AbstractMesh, scene: BABYLON.Scene) {
	let serialized = {}
    original.serialize(serialized)
	let mesh = BABYLON.Mesh.Parse(serialized, scene, "");
	new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.BOX, {mass: 0}, scene);
}

function pointToSegmentDistance(A: BABYLON.Vector3, B: BABYLON.Vector3, P: BABYLON.Vector3): number {
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AP = { x: P.x - A.x, y: P.y - A.y };

    const ab2 = AB.x * AB.x + AB.y * AB.y;
    const ap_dot_ab = AP.x * AB.x + AP.y * AB.y;

    let t = ab2 === 0 ? 0 : ap_dot_ab / ab2;
    t = Math.max(0, Math.min(1, t));

    const closest = { x: A.x + t * AB.x, y: A.y + t * AB.y };

    const dx = P.x - closest.x;
    const dy = P.y - closest.y;

    return Math.sqrt(dx * dx + dy * dy);
}

function calculateTrajectories(balls: Ball[], scene: BABYLON.Scene): TrajectoryPoint[][] {
	balls[0].game.scene.meshes.forEach(mesh => {if (mesh.name == "wall") cloneMesh(mesh, scene)});
	const simFrames = 10;
	const trajectories = [];
	try {
		const simBalls = balls.map(ball => cloneBall(ball.aggregate, scene));
		for (let i = 0; i < simFrames; i++) {
			const points = [];
			scene.getPhysicsEngine()?._step(1000 / simFrames);
			for (const ball of simBalls) {
				points.push({position: ball.transformNode.position.clone(),
							direction: ball.body.getLinearVelocity().clone(), time: i});
			}
			console.log(points[0].position);
			trajectories.push(points);
		}
		//console.log("meshes");
		//scene.meshes.forEach((mesh) => {console.log(mesh.name);});
		for (const mesh of scene.meshes) {
			mesh.physicsBody?.dispose();
			mesh.dispose();
		} 
	} catch (e) {
		console.error(e);
	}
	return trajectories;
}

export function paddleAi(paddles: Paddle[], balls: Ball[], scene: BABYLON.Scene) {
	const trajectories = calculateTrajectories(balls, scene);
	for (const paddle of paddles) {
		if (paddle.player) continue;
		const a = paddle.startPos.clone().addInPlace(paddle.up.scale(10));
		const b = paddle.startPos.clone().addInPlace(paddle.up.scale(-10));
		let closestPoint = BABYLON.Vector3.Zero();
		let closestDistance = Number.MAX_VALUE;
		for (let i = trajectories.length - 1; i > -1; i--) {
			for (const p of trajectories[i]) {
				const distance = pointToSegmentDistance(a, b, p.position);
				const nextDistance = pointToSegmentDistance(a, b, p.position.clone().add(p.direction));
				// (distance < closestDistance && nextDistance < distance) {
					closestDistance = distance;
					closestPoint = p.position;
				//} 
			}
		}
		paddle.target = closestPoint.clone();
	}
}
