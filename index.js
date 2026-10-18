
class Vector2 {

	/**
	 * @type {number}
	 */
	x;

	/**
	 * @type {number}
	 */
	y;

	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 */
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	/**
	 * @param {Vector2} vector
	 * @returns {Vector2}
	 */
	static getSpeed(vector) {
		let newVector = new Vector2();
		newVector.x = vector.x/1000;
		newVector.y = vector.y/1000;

		return newVector;
	}

	/**
	 * 
	 * @param {Vector2} vector
	 * @returns {Vector2} 
	 */
	static applyDelta(vector) {
		let newVector = new Vector2(
			vector.x*deltaTime,
			vector.y*deltaTime
		);

		return newVector;
	}

	/**
	 * 
	 * @param {Vector2[]} vectors
	 * @returns {Vector2}
	 */
	static sumVectors(...vectors) {

		let newVector = new Vector2(0, 0);

		if (vectors.length === 0)
			return newVector;

		vectors.forEach((vector) => {
			newVector.x += vector.x;
			newVector.y += vector.y;
		})

		return newVector;
	}

	/**
	 * 
	 * @param {Vector2[]} vectors
	 * @returns {Vector2}
	 */
	static multiplyVectors(...vectors) {
		
		if (vectors.length === 0)
			return new Vector2(0, 0);

		let newVector = new Vector2(1, 1);

		vectors.forEach((vector) => {
			newVector.x *= vector.x;
			newVector.y *= vector.y;
		})

		return newVector;
	}
}

class CanvasRegister {

	/**
	 * @type {Map<string, CanvasItem>}
	 */
	canvas;

	/**
	 * @type {number}
	 */	
	_counter;

	constructor() {
		this.canvas = [];
		this._counter = 0;
	}

	/**
	 * 
	 * @param {CanvasItem} item 
	 * @returns {number}
	 */
	register(item) {
		this.canvas[this._counter] = item;
		this._counter += 1
		return this._counter-1;
	}

	/**
	 * 
	 * @param {string} id 
	 */
	unregister(id) {
		this.canvas.delete(id);
	}
}

class Signal {
	constructor() {

	}
}

class EventsManager {

	/**
	 * @type {Map<string, CallableFunction[]}
	 */
	static listeners = new Map();

	/**
	 * 
	 * @param {string} event 
	 * @param {CallableFunction} listener 
	 */
	static connect(event, listener) {

	}

}

/**
 * @type {CanvasRegister}
 */
const ITEM_REGISTRY = new CanvasRegister();

/**
 * @type {Map<string, Collision>}
 */
const COLLISION_REGISTRY = new Map();

class CanvasItem {

	/**
	 * @type {number}
	 */
	id
	
	constructor() {
		this.id = ITEM_REGISTRY.register(this);
		
	}

	/**
	 * @returns {null}
	 */
	draw() {}
	process() {}

	free() {
		ITEM_REGISTRY.unregister(this.id);
	}
}

class Collision extends CanvasItem {

	/**
	 * @type {CanvasItem}
	 */
	actor
	
	/**
	 * @type {Vector2}
	 */
	size

	/**
	 * @type {Vector2}
	 */
	position

	/**
	 * @type {Map<number, bool>}
	 */
	layer

	/**
	 * @type {Map<number, bool>}
	 */
	mask_layer

	/**
	 * @type {CallableFunction[]}
	 */
	listeners

	/**
	 * 
	 * @param {CanvasItem} actor 
	 */
	constructor(actor) {
		super();

		this.actor = actor;

		this.size = new Vector2();
		this.position = new Vector2();

		this.layer = new Map();
		this.mask_layer = new Map();

		this.listeners = [];

		COLLISION_REGISTRY[this.id] = this;
	}

	process() {

		COLLISION_REGISTRY.forEach((collision) => {

			let ok = false

			for (let layer in this.mask_layer) {
				if (collision.layer.has(layer)) {
					ok = true;
					break;
				}
			}

			if (!ok) {
				return;
			}

			this.listeners.forEach((func) => func(collision))
			console.log("Detected collision");
		})
	}
	
	free() {
		super.free();
		COLLISION_REGISTRY.delete(this.id);
	}
}

class PlaceableItem extends CanvasItem {

	/**
	 * @type {Vector2}
	 */
	position

	/**
	 * @type {Vector2}
	 */
	scale

	constructor() {
		super();
		this.position = new Vector2(0, 0);
		this.scale = new Vector2(1, 1);
	}

	/**
	 * 
	 * @param {number} speed 
	 * @returns {number}
	 */
	static getSpeed(speed) {
		return speed/1000;
	}
}

class Ghost extends PlaceableItem {

	/**
	 * @type {Collision}
	 */
	collision

	constructor() {
		super();
		this.collision = new Collision();
		this.collision.layer[0] = true;
	}
	
	draw() {
		fill(255, 0, 0);
		//console.log("Drawed ghost");
		ellipse(this.position.x, this.position.y, 100, 100);
	}

	process() {
		this.position.x += random(-3, 3)*deltaTime;
		this.position.y += random(-3, 3)*deltaTime;
	}
}

class Bullet extends PlaceableItem {

	static _imageLoaded;

	/**
	 * @type {Vector2}
	 */
	direction

	/**
	 * @type {Collision}
	 */
	collision

	constructor() {
		super();
		this.direction = new Vector2(0, 0);
		this.collision = new Collision(this);
	}

	/**
	 * @returns {Bullet}
	 */
	static instance() {

		/**
		 * @type {Bullet}
		 */
		let bullet = new Bullet();
		bullet.scale = new Vector2(3, 3);
		bullet.collision.size = new Vector2(Bullet._imageLoaded.width, Bullet._imageLoaded.height);
		bullet.collision.mask_layer[0] = true;
		bullet.collision.layer[1] = true;

		return bullet;
	}

	draw() {
		image(Bullet._imageLoaded, this.position.x, this.position.y, Bullet._imageLoaded.width*this.scale.x, Bullet._imageLoaded.height*this.scale.y);
	}

	process() {

		let speed = Vector2.getSpeed(new Vector2(600, 0))

		this.position = Vector2.sumVectors(
			this.position,
			Vector2.multiplyVectors(speed, this.direction, new Vector2(deltaTime, deltaTime))
		);

		//console.log(this.position);

		//console.log("Processed bullet");
	}

	/**
	 * 
	 * @param {Collision} coll
	 */
	onCollide(coll) {
		coll.actor.free();
	}

}

class Player extends PlaceableItem {

	static _imageLoaded;

	constructor() {
		super();
	}

	async init() {
		this._imageLoaded = await loadImage("./assets/player.png");
	}

	draw() {
		image(this._imageLoaded, this.position.x, this.position.y, this._imageLoaded.width*this.scale.x, this._imageLoaded.height*this.scale.y);
	}

	keyPressed() {

		let speed = PlaceableItem.getSpeed(500);

		if (key === 'w') {
			this.position.y -= speed*deltaTime;
		}

		if (key === 's') {
			this.position.y += speed*deltaTime;
		}
	}

	/**
	 * 
	 * @param {MouseEvent} event 
	 */
	mouseClicked(event) {
		let bullet = Bullet.instance();
		bullet.position.x = this.position.x
		bullet.position.y += this.position.y + this._imageLoaded.height/2;
		bullet.direction.x = 1;
	}
}

const player = new Player();

async function setup() {
	createCanvas(400, 400);
	frameRate(60);
	noSmooth();

	Bullet._imageLoaded = await loadImage("./assets/bullet.png");

	player.scale.x = 3;
	player.scale.y = 3;
	player.position.x = 10;
	await player.init();
}

function draw() {
	background(220);
	
	ITEM_REGISTRY.canvas.forEach((reg) => {
		reg.draw();
		reg.process();
	});
}

function keyPressed() {

	ITEM_REGISTRY.canvas.forEach((reg) => {

		if (!('keyPressed' in reg)) {
			return;
		}

		reg.keyPressed();
	});
}

/**
 * 
 * @param {MouseEvent} event 
 */
function mouseClicked(event) {

	ITEM_REGISTRY.canvas.forEach((reg) => {

		if (!('mouseClicked' in reg)) {
			return;
		}

		reg.mouseClicked(event);
	})
}