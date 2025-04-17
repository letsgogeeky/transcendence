import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { loadPhysics } from './session.js';
import { Ball } from './ball.js';
import { Paddle } from './paddle.js';

type TrajectoryPoint = {
	position: BABYLON.Vector3;
	direction: BABYLON.Vector3;
	time: number;
};

const engine = new BABYLON.NullEngine();
const scene = new BABYLON.Scene(engine);
const havokInstance = await loadPhysics();
const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), havokPlugin);

function clonePhysicsAggregate(original: BABYLON.PhysicsAggregate): BABYLON.PhysicsAggregate | null {
	let newMesh = original.transformNode.clone(original.transformNode.name, null);
	if (!newMesh) return null;
	newMesh.position.copyFrom(original.transformNode.position);
	newMesh.rotationQuaternion = original.transformNode.rotationQuaternion!.clone();
	const newAggregate = new BABYLON.PhysicsAggregate(
		newMesh,
		BABYLON.PhysicsShapeType.SPHERE,
		{mass: original.body.getMassProperties().mass ?? 1},
		scene
	);
	newAggregate.body.setLinearVelocity(original.body.getLinearVelocity().clone());
	newAggregate.body.setAngularVelocity(original.body.getAngularVelocity().clone());
	return newAggregate;
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

function calculateTrajectories(balls: Ball[]): TrajectoryPoint[][] {
	const simBalls = balls.map(ball => clonePhysicsAggregate(ball.aggregate)).filter(ball => ball != null);
	const simFrames = 10;
	const trajectories = [];
	for (let i = 0; i < simFrames; i++) {
		const points = [];
		for (const ball of simBalls)
			points.push({position: ball.transformNode.position.clone(),
						direction: ball.body.getLinearVelocity().clone(), time: i});
		trajectories.push(points);
		scene.getPhysicsEngine()?._step(1000 / simFrames);
	}
	for (const mesh of scene.meshes) {
		mesh.physicsBody?.dispose();
		mesh.dispose();
	} 
	return trajectories;
}

export function paddleAi(paddles: Paddle[], balls: Ball[]) {
	const trajectories = calculateTrajectories(balls);;
	for (const paddle of paddles) {
		if (paddle.player) return;
		const a = paddle.startPos.clone().addInPlace(paddle.up.scale(10));
		const b = paddle.startPos.clone().addInPlace(paddle.up.scale(-10));
		let closestPoint = BABYLON.Vector3.Zero();
		let closestDistance = Number.MAX_SAFE_INTEGER;
		for (let i = trajectories.length - 1; i > -1; i--) {
			for (const p of trajectories[i]) {
				const distance = pointToSegmentDistance(a, b, p.position);
				if (distance < closestDistance) {
					closestDistance = distance;
					closestPoint = p.position;
				} 
			}
		}
		paddle.target = closestPoint;
	}
}
