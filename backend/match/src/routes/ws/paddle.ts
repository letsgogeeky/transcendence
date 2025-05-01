import {Ball} from './ball'
import {Player} from './player'
import * as BABYLON from '@babylonjs/core';

export class Paddle {
	box: BABYLON.Mesh;
	aggregate: BABYLON.PhysicsAggregate;
	speed: number;
	player?: Player;
	limit: number;
	disposed: boolean;
	startPos: BABYLON.Vector3;
	up: BABYLON.Vector3;
	target?: BABYLON.Vector3;
	toTarget?: () => void;
	score: number;
	reverse: boolean;
	name: string;
	balls?: Ball[];
	moving: boolean = false;

	constructor(box: BABYLON.Mesh, material: BABYLON.Material, reverse: boolean, scene: BABYLON.Scene) {
		this.box = box;
		this.aggregate = new BABYLON.PhysicsAggregate(box, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0 }, scene);
		this.aggregate.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);
		this.aggregate.body.disablePreStep = false;
		this.box.material = material.clone(material.name);
		this.speed = 20;
		this.startPos = this.box.position.clone();
		this.limit = 4.3;
		this.disposed = false;
		this.up = this.box.up.clone();
		this.score = 0;
		this.reverse = reverse;
		this.name = "";
		if (reverse && this.startPos.x < 0) this.up.scaleInPlace(-1);
	}

  	moveUp(): void {
		//if (BABYLON.Vector3.Distance(this.box.position.clone().add(this.up.scale(0.8)), this.startPos) < this.limit && !this.disposed)
			this.aggregate.body.setLinearVelocity(this.up.scale(this.speed));
	}
	
	moveDown(): void {
		//if (BABYLON.Vector3.Distance(this.box.position.clone().subtract(this.up.scale(0.8)), this.startPos) < this.limit && !this.disposed)
			this.aggregate.body.setLinearVelocity(this.up.scale(-this.speed));
	}

	turnLeft(): void {
		if (!this.disposed)
			this.aggregate.body.setAngularVelocity(new BABYLON.Vector3(0, 0, -1).scale(this.speed * 0.3));
	}

	turnRight(): void {
		if (!this.disposed)
			this.aggregate.body.setAngularVelocity(new BABYLON.Vector3(0, 0, 1).scale(this.speed * 0.3));
	}

	checkBounds() {
		const minPos = this.startPos.clone().subtract(this.up.scale(this.limit));
		const maxPos = this.startPos.clone().add(this.up.scale(this.limit));
		if (BABYLON.Vector3.Distance(this.box.position, this.startPos) > this.limit)
			if (BABYLON.Vector3.Distance(this.box.position, minPos) < BABYLON.Vector3.Distance(this.box.position, maxPos)) 
				this.box.position = minPos.clone();
			else 
				this.box.position = maxPos.clone();


		// if (BABYLON.Vector3.Distance(this.box.position.clone().add(this.up.scale(0.8)), this.startPos) 
		// || BABYLON.Vector3.Distance(this.box.position.clone().subtract(this.up.scale(0.8)), this.startPos))
	 	// 	this.stopMoving();
	}

	stopMoving() {
		this.aggregate.body.setLinearVelocity(BABYLON.Vector3.Zero());
	}

	stopTurning() {
		this.aggregate.body.setAngularVelocity(BABYLON.Vector3.Zero());
	}
	
	addPoints(n: number): void {
		this.score += n;;
		if (this.player) this.player.score += n;
	}

	defend(): void {
		if (this.player || !this.balls) return;
		let closest: Ball = this.balls[0];
		let distanceToBall = BABYLON.Vector3.Distance(this.box.position, this.balls[0].position);
		for (let i = 1; i < this.balls.length; i++) {
			if (BABYLON.Vector3.Distance(this.box.position, this.balls[i].position) < distanceToBall) {
				closest = this.balls[i];
				distanceToBall = BABYLON.Vector3.Distance(this.box.position, closest.position);
			}
		}
		distanceToBall = BABYLON.Vector3.Distance(this.box.position, closest.position);
		if (distanceToBall > BABYLON.Vector3.Distance(this.box.position.clone().add(this.up), closest.position))
			this.moveUp();
		else if (distanceToBall > BABYLON.Vector3.Distance(this.box.position.clone().subtract(this.up), closest.position)) 
			this.moveDown();
		else
			this.stopMoving();
	}

	moveToTarget() {
		if (this.target) {
			const dist = BABYLON.Vector3.Distance(this.box.position, this.target);
			if (!this.toTarget) {
				if (dist < BABYLON.Vector3.Distance(this.box.position.clone().add(this.up), this.target))
					this.toTarget = this.moveDown;
				else this.toTarget = this.moveUp;
			}
			this.toTarget();
			if (BABYLON.Vector3.Distance(this.box.position, this.target) >= dist) {
				this.target = undefined;
				this.toTarget = undefined;
			}
		}
	}

	die() {
		this.aggregate.body.setMotionType(BABYLON.PhysicsMotionType.STATIC);
		this.box.position = this.startPos.clone();
		this.box.scaling = new BABYLON.Vector3(2, 10, 2);
	}

	dispose() {
		this.disposed = true;
		this.aggregate.dispose();
		this.box.dispose();
	}
}
