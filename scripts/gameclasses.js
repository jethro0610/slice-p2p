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

		this.hitRight= false;
		this.hitLeft = false;
		this.hitTop = false;
		this.hitBottom = false;

		this.maxMoveSpeed = 5;
		this.groundFriction = 0.3;
		this.airFriction = 0.05;

		this.gravitySpeed = 0.5;
		this.maxGravity = 10;
		this.jumpStrength = 10;

		this.velX = 0;
		this.velY = 0;

		this.playerInput = new Inputs();
		this.inputUpLastFrame = false;
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

	updateCollision(){
		// Reset collision
		this.hitRight= false;
		this.hitLeft = false;
		this.hitTop = false;
		this.hitBottom = false;

		// Detect collision with rectangles
		for (var i = 0; i < this.gameWorld.rectangles.length; i++) {
			var rectangleToCheck = this.gameWorld.rectangles[i];
			// If player is within vertical bounds of a rectangle
			if(this.rectangle.bottom() >= rectangleToCheck.top && this.rectangle.top() <= rectangleToCheck.bottom){
				if(this.rectangle.right() >= rectangleToCheck.left && this.rectangle.left() <= rectangleToCheck.left){
					this.hitRight = true;
					this.x = rectangleToCheck.left - this.width;
					this.velX = 0;
				}

				if(this.rectangle.left() <= rectangleToCheck.right && this.rectangle.right() >= rectangleToCheck.right){
					this.hitLeft = true;
					this.x = rectangleToCheck.right;
					this.velX = 0;
				}
			}
			// If player is within horizontal bounds of a rectangle
			if(this.rectangle.right() >= rectangleToCheck.left && this.rectangle.left() <= rectangleToCheck.top){
				if(this.rectangle.bottom() >= rectangleToCheck.top && this.rectangle.top() <= rectangleToCheck.top){
					this.hitBottom = true;
					this.y = rectangleToCheck.top - this.height;
					this.velY = 0;
				}

				if(this.rectangle.top() <= rectangleToCheck.bottom && this.rectangle.bottom() >= rectangleToCheck.bottom){
					this.hitTop = true;
					this.y = rectangleToCheck.top;
					this.velY = 0;
				}
			}
		}

		// Detect collision with walls
		if(this.rectangle.right() >= gameWorld.width){
			this.hitRight = true;
			this.x = gameWorld.width - this.rectangle.width;
			this.velX = 0;
		}
		if(this.rectangle.left() <= 0){
			this.hitLeft = true;
			this.x = 0;
			this.velX = 0;
		}
		if(this.rectangle.top() <= 0){
			this.hitTop = true;
			this.y = 0;
			this.velY = 0;
		}
		if(this.rectangle.bottom() >= gameWorld.height){
			this.hitBottom = true;
			this.y = gameWorld.height - this.rectangle.height;
			this.velY = 0;
		}
	}

	jump(){
		this.velY = -this.jumpStrength;
	}

	tick() {
		this.updateCollision();

		if(!this.inputUpLastFrame && this.playerInput.up){
			if(this.hitBottom)
				this.jump();
		}
		this.inputUpLastFrame = this.playerInput.up;

		// Apply gravity
		this.velY += this.gravitySpeed
		if(this.velY > this.maxGravity)
			this.velY = this.maxGravity;

		// If on ground...
		if(this.hitBottom){
			// Apply friction
			this.velX -= this.velX * this.groundFriction;
			// Move from input
			if(this.playerInput.left)
				this.velX -= this.groundAcc();
			if(this.playerInput.right)
				this.velX += this.groundAcc();
		}
		else{
			// Apply friction
			this.velX -= this.velX * this.airFriction;
			// Move from input
			if(this.playerInput.left)
				this.velX -= this.airAcc();
			if(this.playerInput.right)
				this.velX += this.airAcc();
		}

		// Stop x velocity on walls
		if(this.hitRight && this.velX > 0)
			this.velX = 0;
		if(this.hitLeft && this.velX < 0)
			this.velX = 0;

		// Stop y velocity on ground
		if(this.hitBottom && this.velY > 0)
			this.velY = 0;

		// Apply velocity to position
		this.x += this.velX;
		this.y += this.velY;

		// Update rectangle position
		this.rectangle.x = this.x;
		this.rectangle.y = this.y;
	}
}