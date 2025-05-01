import { Paddle } from "./paddle.js";
import { findPolygonSide } from "./scene.js";
import * as BABYLON from '@babylonjs/core';
import { GameSession } from "./session.js";

export class Ball {
  ball: BABYLON.Mesh;
  aggregate: BABYLON.PhysicsAggregate;
  speed: number;
  startSpeed = 10;
  speedIncrease = 0.01;
  position: BABYLON.Vector3;
  lastTouched: Paddle | undefined;
  secondLastTouched: Paddle | undefined;
  disposed: boolean;
  sceneLimit: number = 0;
  game: GameSession;
  touching: boolean = false;

  constructor(game: GameSession, scene: BABYLON.Scene) {

	this.game = game;

    this.ball = BABYLON.MeshBuilder.CreateSphere("ball" + this.game.balls.length, { diameter: 0.75 }, scene);

    this.speed = this.startSpeed;
	this.position = this.ball.position;
	this.position._x += Math.random() * 5;

    const glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.addIncludedOnlyMesh(this.ball);
    glowLayer.intensity = 0.5;

    const ballAggregate = new BABYLON.PhysicsAggregate(this.ball, BABYLON.PhysicsShapeType.SPHERE, {
      mass: 1,
      restitution: 1,
    }, scene);
    ballAggregate.body.disablePreStep = false;
    ballAggregate.body.setCollisionCallbackEnabled(true);
    this.aggregate = ballAggregate;
	
	ballAggregate.body.getMassProperties().inertia!._x = 0;
	ballAggregate.body.getMassProperties().inertia!._y = 0;

	this.aggregate.body.getCollisionObservable().add((event) => {
		if (this.disposed) return;
		for (const paddle of this.game.paddles) {
			if (paddle.aggregate.body === event.collidedAgainst) {
				if (this.lastTouched != paddle) 
					this.secondLastTouched = this.lastTouched;
				this.lastTouched = paddle;
				this.touching = true;
				setTimeout(() => {
					this.touching = false;
				}, 100);
				break;
			}
		}
	});

	this.disposed = false;

	this.reset(false).catch(console.error);
  }

  step() {
	if (this.disposed) return;
	const minSpeed = this.speed * 0.66;
	const maxSpeed = this.speed * 1.5;
	const currentVelocity = this.aggregate.body.getLinearVelocity().length();
	
	if (currentVelocity < minSpeed)
		this.aggregate.body.setLinearVelocity(this.aggregate.body.getLinearVelocity().normalize().scale(minSpeed));
	else if (currentVelocity > maxSpeed)
		this.aggregate.body.setLinearVelocity(this.aggregate.body.getLinearVelocity().normalize().scale(maxSpeed));
	
	this.speed += this.speedIncrease
	if (this.position.length() > this.sceneLimit) {
		if (this.game.paddles.length == 2 && this.position.length() < this.sceneLimit * 1.7)
			return;
		this.reset(true).catch(console.error);
	}

	this.aggregate.body.setLinearVelocity(new BABYLON.Vector3(this.aggregate.body.getLinearVelocity().x,
	 this.aggregate.body.getLinearVelocity().y, 0));
	this.aggregate.body.transformNode.position.set(this.aggregate.body.transformNode.position.x,
		this.aggregate.body.transformNode.position.y, 0);
}

  async reset(scored: boolean): Promise<void> {
	if (this.disposed) return;
	if (scored) {
		const i = findPolygonSide(this.position);
		let scorer;
		if (this.game.settings.startScore === undefined || this.lastTouched !== undefined) {
			if (!this.touching && this.lastTouched != this.game.paddles[i])
				scorer = this.lastTouched;
			else if (!this.touching && this.secondLastTouched != undefined)
				scorer = this.secondLastTouched;
		}
		if (i < this.game.paddles.length && (this.game.settings.friendlyFire 
			|| (!this.game.paddles[i].player?.teamNumber || !scorer?.player?.teamNumber
				 || this.game.paddles[i].player?.teamNumber !== scorer?.player?.teamNumber))) {
			if (!scorer)
				this.game.paddles[i].addPoints(-1);
			scorer?.addPoints(1);
		}
		await this.game.updateScore();
	}
	this.lastTouched = undefined;
	this.secondLastTouched = undefined;
    this.speed = this.startSpeed;
    this.aggregate.body.transformNode.position.set(0, 0, 0);
    this.aggregate.body.setLinearVelocity(BABYLON.Vector3.Zero());
    this.aggregate.body.setAngularVelocity(BABYLON.Vector3.Zero());
	setTimeout(() => {
		if (this.disposed) return;
		if (this.position.length() < 1)
			this.aggregate.body.applyImpulse(new BABYLON.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0).normalize().scale(10),
				this.ball.absolutePosition);
	}, 1000);
  }

  dispose() {
	this.aggregate.dispose();
	this.ball.dispose();
	this.disposed = true;
  }
}
