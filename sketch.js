
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

const CANVAS_SIZE = new Vector2(500, 400);

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

	clear() {
		this.canvas.forEach((val, id) => {
			val.forceFree();
		})
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
	static spawnTime = 3;

	/**
	 * @type {number}
	 */
	static _leftTime = 3;

	static _spawnArea = new Vector2(CANVAS_SIZE.x, CANVAS_SIZE.x + 50);

	static entitiesCap = 10;

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

		if (this._entities.length >= this.entitiesCap) {
			return;
		}

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

	/**
	 * 
	 * @param {typeof CharacterItem} entityType 
	 */
	static removeEntity(entityType) {
		EntitiesSpawner._entities = EntitiesSpawner._entities.filter(entity => entity !== entityType);
	}

	static spawnEntity() {

		if (EntitiesSpawner._entities.length === 0) {
			return;
		}

		console.log("Spawning enemy");
		let type = random(EntitiesSpawner._entities);

		if (type === undefined) {
			console.log("Type is undefined, num = ", type);
			return;
		}

		/**
		 * @type {CharacterItem}
		 */
		let entity = new type();
		entity.position.x = random(EntitiesSpawner._spawnArea.x, EntitiesSpawner._spawnArea.y);
		entity.position.y = random(0, CANVAS_SIZE.y - 40);
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

	forceFree() {
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
	listeners = []
	
	/**
	 * @type {CallableFunction[]}
	 */
	mouseListeners = []

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
		this.mouseListeners = [];

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

	mouseClicked() {

		if (this.vecIsInto(new Vector2(mouseX, mouseY))) {
			this.mouseListeners.forEach((func) => func())
		}
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

	/**
	 * 
	 * @param {Vector2} vector
	 * @returns {bool} 
	 */
	vecIsInto(vector) {

		let pos = this.getRealPos();

		if (pos.x + this.size.x < vector.x) {
			return false;
		}

		if (pos.x > vector.x) {
			return false;
		}

		if (pos.y + this.size.y < vector.y) {
			return false;
		}

		if (pos.y > vector.y) {
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

class Monster extends CharacterItem {

	constructor() {
		super();
		this.collision.layer.set(0, true)
		this.collision.mask_layer.set(2, true);
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

class Ghost extends Monster {

	static _imageLoaded

	constructor() {
		super();
		this.scale = new Vector2(3, 3);
		this.collision.size = new Vector2(Ghost._imageLoaded.width * this.scale.x, Ghost._imageLoaded.height * this.scale.y);
	}
	
	draw() {
		//console.log("Drawed ghost");
		image(Ghost._imageLoaded, this.position.x, this.position.y, Ghost._imageLoaded.width * this.scale.x, Ghost._imageLoaded.height * this.scale.y);
	}

	process() {
		this.position.x -= PlaceableItem.getSpeed(75) * deltaTime;
	}
}

class Skeleton extends Monster {

	static _imageLoaded

	/**
	 * @type {number}
	 */
	throwTime = 1;

	currentThrowTime = 1;

	currentAwaitTime

	constructor() {
		super();

		this.currentThrowTime = this.throwTime;
		this.currentAwaitTime = 0;

		this.scale = new Vector2(2, 2);
		this.collision.size = new Vector2(Skeleton._imageLoaded.width * this.scale.x, Skeleton._imageLoaded.height * this.scale.y);
	}

	draw() {
		image(Skeleton._imageLoaded, this.position.x, this.position.y, Skeleton._imageLoaded.width * this.scale.x, Skeleton._imageLoaded.height * this.scale.y);
	}

	process() {

		if (this.currentAwaitTime > 0) {
			this.currentAwaitTime -= deltaTime/1000;
			return;
		}

		this.currentThrowTime -= deltaTime/1000;

		if (this.currentThrowTime <= 0.0) {
			const res = random(0, 1);

			if (res >= 0.5) {
				const bone = Bone.instance();
				bone.position.x = this.position.x;
				bone.position.y = this.position.y + Skeleton._imageLoaded.height/2;
				this.currentAwaitTime = 0.5;
			}

			this.currentThrowTime = this.throwTime;
		}
		else {
			this.position.x -= PlaceableItem.getSpeed(75) * deltaTime;
		}
	}
}

class Bone extends Monster {

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

		this.direction = new Vector2(1, 0);
	}

	/**
	 * @returns {Bone}
	 */
	static instance() {

		/**
		 * @type {Bone}
		 */
		let bullet = new Bone();
		bullet.scale = new Vector2(2, 2);
		bullet.collision.size = new Vector2(
			Bone._imageLoaded.width * bullet.scale.x,
			Bone._imageLoaded.height * bullet.scale.y
		);

		return bullet;
	}

	draw() {
		image(Bone._imageLoaded, this.position.x, this.position.y, Bone._imageLoaded.width*this.scale.x, Bone._imageLoaded.height*this.scale.y);
	}

	process() {

		let speed = Vector2.getSpeed(new Vector2(-300, 0))

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
}

class Witch extends Monster {

	static _imageLoaded;

	/**
	 * @type {number}
	 */
	hits

	changePositionTime = 1
	currentChangePositionTime = 1;
	multiplicator = 0;

	constructor() {
		super();

		this.currentChangePositionTime = this.changePositionTime
		this.hits = 2;
		this.multiplicator = 0;
		this.scale = new Vector2(2, 2);
		this.collision.size = new Vector2(
			Witch._imageLoaded.width * this.scale.x,
			Witch._imageLoaded.height * this.scale.y,
		)
	}

	draw() {
		image(Witch._imageLoaded, this.position.x, this.position.y, Witch._imageLoaded.width * this.scale.x, Witch._imageLoaded.height * this.scale.y);
	}

	process() {

		this.position.x += PlaceableItem.getSpeed(-75) * deltaTime;
		this.currentChangePositionTime -= deltaTime/1000;

		if (this.currentChangePositionTime <= 0) {

			const res = random(0, 1);

			if (res >= 0.5) {
				
				if (this.multiplicator === 0) {
					this.multiplicator = random([-1, 1])
				}

				this.position.y += PlaceableItem.getSpeed(this.multiplicator*100) * deltaTime;
				this.position.y = constrain(this.position.y, 0, CANVAS_SIZE.y - Witch._imageLoaded.height*this.scale.y)
			}

			if (this.currentChangePositionTime <= -1) {
				this.currentChangePositionTime = this.changePositionTime;
				this.multiplicator = 0;
			}
		}
	}

	free() {

		if (this.hits > 0) {
			this.hits -= 1;
			return;
		}

		super.free();
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

		if (coll.actor instanceof Monster) {
			coll.actor.free();

			this.free();
			console.log("Detected collision")
		}

	}
}

class Player extends CharacterItem {

	static _imageLoaded;

	/**
	 * @type {number}
	 */
	bulletCooldown = 0.25;
	currentBulletCooldown = 0.5;

	/**
	 * @type {CallableFunction[]}
	 */
	dieListeners = []

	_died = false;

	constructor() {
		super();
		this.bulletCooldown = 0.25;

		this.scale = new Vector2(3, 3);
		this.currentBulletCooldown = this.bulletCooldown;
		this.collision.layer.set(2, true);

		this.collision.size = new Vector2(
			Player._imageLoaded.width * this.scale.x,
			Player._imageLoaded.height * this.scale.y
		);
	}

	static async init() {
		Player._imageLoaded = await loadImage("./assets/player.png");
	}

	draw() {
		image(Player._imageLoaded, this.position.x, this.position.y, Player._imageLoaded.width*this.scale.x, Player._imageLoaded.height*this.scale.y);
	}

	process() {
		
		if (this.currentBulletCooldown > 0) {
			this.currentBulletCooldown -= deltaTime/1000;
		}
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
			CANVAS_SIZE.y - Player._imageLoaded.height*this.scale.y
		)
	}

	/**
	 * 
	 * @param {MouseEvent} event 
	 */
	mouseClicked(event) {

		if (this.currentBulletCooldown > 0) {
			return
		}

		let bullet = Bullet.instance();
		bullet.position.x = this.position.x
		bullet.position.y += this.position.y + Player._imageLoaded.height/2;
		bullet.direction.x = 1;

		this.currentBulletCooldown = this.bulletCooldown;
	}

	/**
	 * 
	 * @param {Collision} coll 
	 */
	onCollide(coll) {
		this.free();
	}

	free() {

		if (this._died) {
			return;
		}

		this._died = true;
		this.dieListeners.forEach(func => func());
		super.free();
	}
}

class Button extends CharacterItem {

	/**
	 * @type {string}
	 */
	text

	/**
	 * @type {number}
	 */
	textSize = 8

	/**
	 * @type {Vector2}
	 */
	size

	/**
	 * @type {number[]}
	 */
	color;

	/**
	 * @type {CallableFunction[]}
	 */
	pressedListeners = []

	constructor() {
		super();
		this.setSize(new Vector2(16, 8));

		this.pressedListeners = [];
		this.collision.mouseListeners.push(this.onPressed.bind(this));
	}

	/**
	 * 
	 * @param {Vector2} vector 
	 */
	setSize(vector) {
		this.size = vector;
		this.collision.size = this.size;
	}

	draw() {
		fill(this.color[0], this.color[1], this.color[2], this.color[3]);
		rect(this.position.x, this.position.y, this.size.x, this.size.y);

		fill(255);
		textSize(this.textSize);
		text(this.text, this.position.x + this.size.x/2 - this.textSize, this.position.y + this.size.y/2 + this.textSize/2);
	}

	onPressed() {
		this.pressedListeners.forEach((func) => func())
	}
}

class GameState {

	title

	async setup() {}
	
	async start() {}

	async exit() {}

	draw() {}

	keyPressed() {}

	mouseClicked() {}
}

class StartState extends GameState {

	/**
	 * @type {Button}
	 */
	startButton

	async setup() {
		Bullet._imageLoaded = await loadImage("./assets/bullet.png");
		Ghost._imageLoaded = await loadImage("./assets/ghost.png");
		Bone._imageLoaded = await loadImage("./assets/bone.png");
		Skeleton._imageLoaded = await loadImage("./assets/skeleton.png");
		Witch._imageLoaded = await loadImage("./assets/witch.png")
		await Player.init();

		this.start();
	}

	start() {
		
		this.startButton = new Button();
		this.startButton.text = "Start";
		this.startButton.color = [255, 50, 100, 255];
		this.startButton.setSize(new Vector2(80, 16))
		this.startButton.position = new Vector2((CANVAS_SIZE.x - this.startButton.size.x)/2, (CANVAS_SIZE.y - this.startButton.size.y)/2);

		this.startButton.pressedListeners.push(this.exit);

		console.log("Invoked start button");
	}

	exit() {
		ITEM_REGISTRY.clear();

		state = new PlayingState();
		state.start();

		console.log("Button Clicked");
	}

	draw() {
		background(50);

		ITEM_REGISTRY.canvas.forEach((reg) => {
			reg.draw();
			reg.process();
		});
	}
}

class DiedState extends GameState {

	/**
	 * @type {Button}
	 */
	returnButton

	start() {

		fill(255);
		
		this.returnButton = new Button();
		this.returnButton.text = "Try Again!";
		this.returnButton.color = [255, 50, 100, 255];
		this.returnButton.setSize(new Vector2(80, 16))
		this.returnButton.position = new Vector2((CANVAS_SIZE.x - this.returnButton.size.x)/2, (CANVAS_SIZE.y - this.returnButton.size.y)/2);
		
		this.returnButton.pressedListeners.push(this.exit.bind(this));
	}

	exit() {
		ITEM_REGISTRY.clear();

		state = new StartState();
		state.start();
	}

	draw() {
		background(50);

		ITEM_REGISTRY.canvas.forEach((val) => {
			val.draw();
			val.process();
		})

		fill(255)
		textSize(8);
		text("You died!", (this.returnButton.position.x + this.returnButton.size.x/3), this.returnButton.position.y - 40);
	}
}

class PlayingState extends GameState {

	/**
	 * @type {Player}
	 */
	player;

	/**
	 * @type {number[][]}
	 */
	backgroundPoints = [];
	dispersion = 0.0005;

	start() {
		this.player = new Player();
		this.player.position.x = 10;
		this.player.dieListeners.push(this.onDiePlayer.bind(this));

		EntitiesSpawner.addEntity(Ghost);
		EntitiesSpawner.addEntity(Skeleton);
		EntitiesSpawner.addEntity(Witch);

		for (let y = 1; y < CANVAS_SIZE.y; y++) {
			for (let x = 1; x < CANVAS_SIZE.x; x++) {
				const res = random(0, 1);

				if (res < this.dispersion) {
					this.backgroundPoints.push([x, y, random(100, 255)]);
				} 
			}
		}
	}

	exit() {

		EntitiesSpawner.removeEntity(Ghost);
		EntitiesSpawner.removeEntity(Skeleton);
		EntitiesSpawner.removeEntity(Witch);
		ITEM_REGISTRY.clear();

		state = new DiedState();
		state.start();
	}

	onDiePlayer() {
		this.exit();
	}

	draw() {
		background(50);

		this.drawPoints();

		ITEM_REGISTRY.canvas.forEach((reg) => {
			reg.draw();
			reg.process();
		});

		EntitiesSpawner.process();
	}

	async drawPoints() {
		this.backgroundPoints.forEach((val) => {

			stroke(255, 255, 255, val[2]);
			point(val[0], val[1], 0);
		})
	}
}

/**
 * @type {GameState}
 */
let state = new StartState();

async function setup() {
	createCanvas(CANVAS_SIZE.x, CANVAS_SIZE.y);
	frameRate(60);
	noSmooth();

	await state.setup();
}

function draw() {
	
	state.draw();

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

	if (key === "t") {
		state.exit();
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