import { Paddle } from "./paddle.js";
import { findPolygonSide } from "./scene.js";
import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { GameSession } from "./session.js";

export class Ball {
  ball: BABYLON.Mesh;
  aggregate: BABYLON.PhysicsAggregate;
  speed: number;
  position: BABYLON.Vector3;
  lastTouched: Paddle | undefined;
  secondLastTouched: Paddle | undefined;
  disposed: boolean;
  //particleSystem: BABYLON.ParticleSystem;
  sceneLimit: number = 0;
  game: GameSession;

  constructor(game: GameSession, scene: BABYLON.Scene) {
    // const ballMaterial = new BABYLON.StandardMaterial("ballMat", scene);
    // ballMaterial.diffuseTexture = new BABYLON.Texture("src/game/ball.png");
    // ballMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);

	this.game = game;

    this.ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 0.8 }, scene);
    //this.ball.material = ballMaterial;

    this.speed = 10;
	this.position = this.ball.position;

    const pointLight = new BABYLON.PointLight("pointLight", this.ball.position, scene);
    pointLight.intensity = 0.8;
    pointLight.range = 20;
    pointLight.diffuse = new BABYLON.Color3(1, 1, 1);

    const glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.addIncludedOnlyMesh(this.ball);
    glowLayer.intensity = 0.4;

    const ballAggregate = new BABYLON.PhysicsAggregate(this.ball, BABYLON.PhysicsShapeType.SPHERE, {
      mass: 1,
      restitution: 1,
    }, scene);
    ballAggregate.body.disablePreStep = false;
    ballAggregate.body.setCollisionCallbackEnabled(true);
    this.aggregate = ballAggregate;

    // this.particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
    // let particleEmitter = this.particleSystem.createSphereEmitter(0.8);
    // this.particleSystem.particleTexture = new BABYLON.Texture("src/game/particle.png", scene);
    // this.particleSystem.minSize = 0.02;
    // this.particleSystem.maxSize = 0.1;
    // this.particleSystem.minLifeTime = 0.3;
    // this.particleSystem.maxLifeTime = 0.5;
    // this.particleSystem.minEmitPower = 2;
    // this.particleSystem.maxEmitPower = 4;
    // this.particleSystem.updateSpeed = 0.005;
    // this.particleSystem.start();

	this.aggregate.body.getCollisionObservable().add((event) => {
		if (this.disposed) return;
		for (const paddle of this.game.paddles) {
			if (paddle.aggregate.body === event.collidedAgainst) {
				if (this.lastTouched != paddle) 
					this.secondLastTouched = this.lastTouched;
				this.lastTouched = paddle;
				break;
			}
		}
	});

	this.disposed = false;

	this.reset(false);
  }

  step() {
	//this.particleSystem.emitRate = 0;
	if (this.disposed) return;
	//this.particleSystem.emitRate = 1000;
	const minSpeed = this.speed * 0.66;
	const maxSpeed = this.speed * 1.5;
	const currentVelocity = this.aggregate.body.getLinearVelocity().length();
	if (currentVelocity < minSpeed)
		this.aggregate.body.setLinearVelocity(this.aggregate.body.getLinearVelocity().normalize().scale(minSpeed));
	else if (currentVelocity > maxSpeed)
		this.aggregate.body.setLinearVelocity(this.aggregate.body.getLinearVelocity().normalize().scale(maxSpeed));
	//pointLight.position = this.ball.absolutePosition;
	//this.particleSystem.emitter = this.ball.absolutePosition;
	this.speed += 0.01;
	if (this.position.length() > this.sceneLimit) {
		if (this.game.paddles.length == 2 && this.position.length() < this.sceneLimit * 1.7)
			return;
		this.reset(true);
	}
	this.aggregate.body.getLinearVelocity().z = 0;
	this.aggregate.body.transformNode.position.z = 0;
}

  reset(scored: boolean): void {
	if (this.disposed) return;
	if (scored) {
		const i = findPolygonSide(this.position);
		if (i < this.game.paddles.length)
			this.game.paddles[i].score--;
		if (this.game.settings.startScore === undefined && this.lastTouched !== undefined) {
			if (this.lastTouched != this.game.paddles[i])
				this.lastTouched.score++;
			else if (this.secondLastTouched != undefined)
				this.secondLastTouched.score++;
		}
		this.game.updateScore();	
	}
	this.lastTouched = undefined;
	this.secondLastTouched = undefined;
    this.speed = 10;
    this.aggregate.body.transformNode.position.set(0, 0, 0);
    this.aggregate.body.setLinearVelocity(BABYLON.Vector3.Zero());
    this.aggregate.body.setAngularVelocity(BABYLON.Vector3.Zero());
	setTimeout(() => {
		if (this.disposed) return;
		this.aggregate.body.applyImpulse(new BABYLON.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, 0).normalize().scale(10),
			this.ball.absolutePosition);
	}, 0.5 + Math.random() * 500);
  }

  dispose() {
	this.aggregate.dispose();
	this.ball.dispose();
	//this.particleSystem.dispose();
	this.disposed = true;
  }
}
