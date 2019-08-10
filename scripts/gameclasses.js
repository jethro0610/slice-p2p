function Inputs() {
	this.up = false
	this.down = false;
	this.left = false;
	this.right = false;
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
		this.x = x;
		this.y = y;
		this.rectangle = new Rectangle(32, 32, this.x, this.y);
		this.gameWorld = gameWorld;
		this.playerInput = new Inputs();
	}

	tick() {
		// Update rectangle position
		this.rectangle.x = this.x;
		this.rectangle.y = this.y
	}
}