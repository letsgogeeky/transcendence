import {Ball} from './ball'

export class Paddle {
	box: BABYLON.Mesh;
	aggregate: BABYLON.PhysicsAggregate;
	speed: number;
	player: boolean;
	limit: number;
	disposed: boolean;
	startPos: BABYLON.Vector3;
	up: BABYLON.Vector3;
	score: number;
	index: number;

	constructor(box: BABYLON.Mesh, material: BABYLON.Material, index: number, scene: BABYLON.Scene) {
		this.box = box;
		this.aggregate = new BABYLON.PhysicsAggregate(box, BABYLON.PhysicsShapeType.BOX, { mass: 0, restitution: 0 }, scene);
		this.aggregate.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);
		this.aggregate.body.disablePreStep = false;
		this.box.material = material;
		this.speed = 15;
		this.player = false;
		this.startPos = this.box.position.clone();
		this.limit = 5;
		this.disposed = false;
		this.up = this.box.up.clone();
		this.score = 0;
		this.index = index;
	}

  	moveUp(): void {
	  	window.paddles.length > 2 && this.index < window.paddles.length ? this.goDown() : this.goUp();
	}
	
	
	moveDown(): void {
		window.paddles.length > 2 && this.index < window.paddles.length ? this.goUp() : this.goDown();
	}

	goUp(): void {
	  if (BABYLON.Vector3.Distance(this.box.position.clone().add(this.up.scale(0.8)), this.startPos) < this.limit && !this.disposed) {
		  this.aggregate.body.setLinearVelocity(this.up.scale(this.speed));
		} else {
		  this.stopMoving();
		}
	}

	goDown(): void {
		if (BABYLON.Vector3.Distance(this.box.position.clone().subtract(this.up.scale(0.8)), this.startPos) < this.limit && !this.disposed) {
			this.aggregate.body.setLinearVelocity(this.up.scale(-this.speed));
			} else {
				this.stopMoving();
			}
	}
  

	turnLeft(): void {
		if (!this.disposed) {
			this.aggregate.body.setAngularVelocity(this.box.right.scale(-this.speed / 3));
		}
	}

	turnRight(): void {
		if (!this.disposed) {
			this.aggregate.body.setAngularVelocity(this.box.right.scale(this.speed / 3));
		}
	}

	stopMoving(): void {
		if (!this.disposed) {
		this.aggregate.body.setLinearVelocity(BABYLON.Vector3.Zero());
		}
	}

	stopTurning(): void {
		if (!this.disposed) {
			this.aggregate.body.setAngularVelocity(BABYLON.Vector3.Zero());
		}
	}

	defend(balls: Ball[]): void {
		if (this.player) return;
		let closest: Ball = balls[0];
		let distanceToBall = BABYLON.Vector3.Distance(this.box.position, balls[0].position);
		for (let i = 1; i < balls.length; i++) {
			if (BABYLON.Vector3.Distance(this.box.position, balls[i].position) < distanceToBall) {
				closest = balls[i];
				distanceToBall = BABYLON.Vector3.Distance(this.box.position, closest.position);
			}
		}

		distanceToBall = BABYLON.Vector3.Distance(this.box.position.clone().add(this.up), closest.position);
		if (distanceToBall < BABYLON.Vector3.Distance(this.box.position, closest.position)) {
		this.goUp();
		} else {
		this.goDown();
		}
	}

	dispose(): void {
		this.aggregate.dispose();
		this.box.dispose();
		this.disposed = true;
	}
}
