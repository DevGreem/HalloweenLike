
let DEBUG_MODE = false;

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

const CANVAS_SIZE = new Vector2(400, 400);

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
		this.canvas = new Map();
		this._counter = 0;
	}

	/**
	 * 
	 * @param {CanvasItem} item 
	 * @returns {number}
	 */
	register(item) {
		this.canvas.set(this._counter, item);
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

class EntitiesSpawner {

	/**
	 * @type {PlaceableItem[]}
	 */
	static _entities = []

	/**
	 * @type {number}
	 */
	static spawnTime = 20;

	/**
	 * @type {number}
	 */
	static _leftTime = 20;

	static _spawnArea = new Vector2(CANVAS_SIZE.x, CANVAS_SIZE.x + 50);

	/**
	 * 
	 * @param {number} spawnTime 
	 */
	constructor(spawnTime) {
		EntitiesSpawner._entities = [];
		EntitiesSpawner.spawnTime = spawnTime;
		EntitiesSpawner._leftTime = spawnTime;
	}

	static process() {
		EntitiesSpawner._leftTime -= deltaTime/1000;

		if (EntitiesSpawner._leftTime <= 0) {
			EntitiesSpawner._leftTime = EntitiesSpawner.spawnTime
			EntitiesSpawner.spawnEntity();
		}
	}

	/**
	 * 
	 * @param {typeof CharacterItem} entityType 
	 */
	static addEntity(entityType) {
		EntitiesSpawner._entities.push(entityType);
	}

	static spawnEntity() {

		if (EntitiesSpawner._entities.length === 0) {
			return;
		}

		console.log("Spawning enemy");
		let type = EntitiesSpawner._entities[random(0, EntitiesSpawner._entities.length-1)];
		let entity = new type();
		entity.position.x = random(EntitiesSpawner._spawnArea.x, EntitiesSpawner._spawnArea.y);
		entity.position.y = random(0, CANVAS_SIZE.y);
	}
}

/**
 * @type {CanvasRegister}
 */
const ITEM_REGISTRY = new CanvasRegister();

/**
 * @type {Map<number, Collision>}
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
	 * @type {CharacterItem}
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
	 * @type {Vector2}
	 */
	offset

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
		this.offset = new Vector2();

		this.layer = new Map();
		this.mask_layer = new Map();

		this.listeners = [];

		COLLISION_REGISTRY.set(this.id, this)
		// console.log("Constructed collision with id ", this.id)

		// console.log("All collisions: ", COLLISION_REGISTRY)
	}

	/**
	 * @returns {Vector2}
	 */
	getRealPos() {
		return new Vector2(
			this.position.x+this.offset.x,
			this.position.y+this.offset.y
		)
	}
	
	draw() {

		if (!DEBUG_MODE) {
			return;
		}

		this.position = this.actor.position;

		fill(255, 0, 0, 50);

		let pos = this.getRealPos()
		rect(pos.x, pos.y, this.size.x, this.size.y);
	}

	process() {
		//console.log("Processing collisions");

		this.position = this.actor.position;

		COLLISION_REGISTRY.forEach((collision) => {

			let ok = false
			//console.log("Searching Collisions...")

			for (const layer of this.mask_layer.keys()) {
				if (!collision.layer.has(layer)) {
					continue;
				}

				

				ok = true;
				break;
			}

			if (!ok) {
				//console.log("Not collisioned");
				return;
			}

			if (!collision.isInto(this)) {
				//console.log("Collision detected but outside of the area");
				return;
			}

			this.listeners.forEach((func) => func(collision))
			//console.log("Detected collision");
		})
	}

	/**
	 * 
	 * @param {Collision} other 
	 * @returns {bool}
	 */
	isInto(other) {

		let pos = this.getRealPos();
		let otherPos = other.getRealPos();

		if (pos.x + this.size.x < otherPos.x) {
			return false;
		}

		if (pos.x > otherPos.x + other.size.x) {
			return false;
		}

		if (pos.y + this.size.y < otherPos.y) {
			return false;
		}

		if (pos.y > otherPos.y + other.size.y) {
			return false;
		}

		return true;
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

class CharacterItem extends PlaceableItem {

	/**
	 * @type {Collision}
	 */
	collision

	constructor() {
		super();
		this.collision = new Collision(this);
		this.collision.listeners.push(this.onCollide.bind(this));
	}

	/**
	 * 
	 * @param {Collision} coll 
	 */
	onCollide(coll) {}

	free() {
		this.collision.free();
		super.free();
	}

}

class Ghost extends CharacterItem {

	constructor() {
		super();
		this.collision.layer.set(0, true)
		this.collision.mask_layer.set(2, true);

		this.collision.size = new Vector2(100, 100);
		this.collision.offset = new Vector2(-50, -50);
	}
	
	draw() {
		fill(255, 0, 0);
		//console.log("Drawed ghost");
		ellipse(this.position.x, this.position.y, 100, 100);
	}

	process() {
		// this.position.x += random(-3, 3)*deltaTime;
		// this.position.y += random(-3, 3)*deltaTime;
	}

	/**
	 * 
	 * @param {Collision} coll 
	 */
	onCollide(coll) {
		
		if (coll.actor instanceof Bullet) {
			this.free();
		}
		else if (coll.actor instanceof Player) {
			coll.actor.free();
		}
	}
}

class Bullet extends CharacterItem {

	static _imageLoaded;

	/**
	 * @type {Vector2}
	 */
	direction

	/**
	 * @type {number}
	 */
	timeLimit

	/**
	 * @type {number}
	 */
	currentTime

	constructor() {
		super();

		this.direction = new Vector2(0, 0);

		this.collision.mask_layer.set(0, true);
		this.collision.layer.set(1, true);
		this.collision.offset.x = -6;
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
		bullet.collision.size = new Vector2(
			Bullet._imageLoaded.width * bullet.scale.x,
			Bullet._imageLoaded.height * bullet.scale.y
		);

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

		if (this.position.x > CANVAS_SIZE.x || this.position.x < 0) {
			this.free();
		}
		else if (this.position.y > CANVAS_SIZE.y || this.position.y < 0) {
			this.free();
		}

		//console.log(this.position);

		//console.log("Processed bullet");
	}

	/**
	 * 
	 * @param {Collision} coll
	 */
	onCollide(coll) {

		if (coll.actor instanceof Ghost) {
			coll.actor.free();
		}

		this.free();
		console.log("Detected collision")
	}
}

class Player extends CharacterItem {

	static _imageLoaded;

	constructor() {
		super();

		this.collision.layer.set(2, true);
	}

	async init() {
		this._imageLoaded = await loadImage("./assets/player.png");

		this.collision.size = new Vector2(
			16 * 3,
			12 * 3
		);
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
		
		this.position.y = constrain(
			this.position.y, 0,
			CANVAS_SIZE.y - this._imageLoaded.height*this.scale.y
		)
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

	/**
	 * 
	 * @param {Collision} coll 
	 */
	onCollide(coll) {
		this.free();
	}
}
const player = new Player();

async function setup() {
	createCanvas(CANVAS_SIZE.x, CANVAS_SIZE.y);
	frameRate(60);
	noSmooth();

	Bullet._imageLoaded = await loadImage("./assets/bullet.png");

	player.scale.x = 3;
	player.scale.y = 3;
	player.position.x = 10;
	await player.init();


	EntitiesSpawner.addEntity(Ghost);
}

function draw() {
	background(220);
	
	ITEM_REGISTRY.canvas.forEach((reg) => {
		reg.draw();
		reg.process();
	});

	EntitiesSpawner.process();

	//console.log("Collisions: ", COLLISION_REGISTRY);
}

function keyPressed() {

	ITEM_REGISTRY.canvas.forEach((reg) => {

		if (!('keyPressed' in reg)) {
			return;
		}

		reg.keyPressed();
	});

	if (key === 'p') {
		DEBUG_MODE = !DEBUG_MODE;
	}
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