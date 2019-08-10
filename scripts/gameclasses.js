function Inputs() {
	this.up = false
	this.down = false;
	this.left = false;
	this.right = false;

	this.copyFromAnotherInput = function(inputToCopy){
		this.up = inputToCopy.up;
		this.down = inputToCopy.down;
		this.left = inputToCopy.left;
		this.right = inputToCopy.right;
	}
}

class GameWorld {
	constructor(width, height){
		this.width = width;
		this.height = height;
		this.rectangles = [];
		this.players = [];
	}

	addPlayer(x, y) {
		var newPlayer = new Player(x, y, this);
		this.players.push(newPlayer);
		return newPlayer
	}

	addRectangle(width, height, x, y) {
		var newRectangle = new Rectangle(width, height, x, y);
		this.rectangles.push(newRectangle);
		return newRectangle;
	}

	tick(){
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].tick();
		}
	}
}

class Rectangle {
	constructor(width, height, x, y){
		this.width = width;
		this.height = height;
		this.x = x;
		this.y = y;
	}

	top(){
		return this.y;
	}

	bottom(){
		return this.y + this.height;
	}

	left(){
		return this.x;
	}
	
	right(){
		return this.x + this.width;
	}
}

class Player {
	constructor(x, y, gameWorld) {
		this.gameWorld = gameWorld;
		this.x = x;
		this.y = y;
		this.rectangle = new Rectangle(32, 32, this.x, this.y);

		this.maxMoveSpeed = 5;
		this.groundFriction = 0.3;
		this.airFriction = 0.05;

		this.velX = 0;
		this.velY = 0;

		this.playerInput = new Inputs();
	}

	setFriction(newFriction){
		this.friction = newFriction;
	}

	groundAcc(){
		return (this.maxMoveSpeed * this.groundFriction) / (-this.groundFriction + 1.0);
	}

	airAcc(){
		return (this.maxMoveSpeed * this.airFriction) / (-this.airFriction + 1.0);
	}

	tick() {
		// Apply friction
		this.velX -= this.velX * 0.2;

		// Move from input
		if(this.playerInput.left)
			this.velX -= this.groundAcc();
		if(this.playerInput.right)
			this.velX += this.groundAcc();

		this.x += this.velX;
		this.y += this.velY;

		// Update rectangle position
		this.rectangle.x = this.x;
		this.rectangle.y = this.y
	}
}