function Inputs() {
	this.up = false
	this.down = false;
	this.left = false;
	this.right = false;
	this.dash = false;

	this.copyFromAnotherInput = function(inputToCopy){
		this.up = inputToCopy.up;
		this.down = inputToCopy.down;
		this.left = inputToCopy.left;
		this.right = inputToCopy.right;
		this.dash = inputToCopy.dash;
	}
}

function lerp(value1, value2, t){
	return value1*t + value2*(1-t);
}

function getDistance(point1, point2){
	return Math.abs(point1 - point2);
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

	isIntersecting(otherRectangle){
		if(this.top() > otherRectangle.bottom())
			return false;
		if(this.bottom() < otherRectangle.top())
			return false;
		if(this.left() > otherRectangle.right())
			return false;
		if(this.right() < otherRectangle.left())
			return false;

		return true;
	}
}

class Player {
	constructor(x, y, gameWorld) {
		this.gameWorld = gameWorld;
		this.x = x;
		this.y = y;
		this.rectangle = new Rectangle(32, 64, this.x, this.y);

		this.hitRight= false;
		this.hitLeft = false;
		this.hitTop = false;
		this.hitBottom = false;

		this.maxMoveSpeed = 10;
		this.groundFriction = 0.1;
		this.airFriction = 0.05;

		this.pivotSpeed = 0.6

		this.gravitySpeed = 1;
		this.maxGravity = 15;
		this.jumpStrength = 20;

		this.velX = 0;
		this.velY = 0;

		this.direction = 'right';

		this.playerInput = new Inputs();
		this.inputUpLastFrame = false;

		this.dashSpeed = 30;
		this.dashLength = 5;
		this.dashTimer = 0;
		this.canDash = true;
		this.dashing = false;

		this.moveCooldown = 0;
		this.moveCooldownLength = 10;
		this.hitCooldown = 0;
		this.hitCooldownLength = 20;

		this.timeDialation = 1;

		this.drawX = this.x;
		this.drawY = this.y;
		this.extrapolationStrength = 0.5;
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

	centerX(){
		return this.x + (this.rectangle.width / 2);
	}

	centerY(){
		return this.y + (this.rectangle.height / 2);
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

		// Move cooldown
		if(this.moveCooldown > 0){
			this.moveCooldown -= 1 * this.timeDialation;
			this.playerInput = new Inputs();
		}

		if(this.hitBottom && this.playerInput.up)
			this.jump();

		this.inputUpLastFrame = this.playerInput.up;

		// Apply gravity
		if(!this.dashing){
			this.velY += this.gravitySpeed * this.timeDialation;
			if(this.velY > this.maxGravity)
				this.velY = this.maxGravity;
		}

		// Movement
		var frictionToUse;;
		var accelerationToUse;
		if(this.hitBottom){
			frictionToUse = this.groundFriction * this.timeDialation;
			accelerationToUse = this.groundAcc() * this.timeDialation;
		}
		else{
			frictionToUse = this.airFriction * this.timeDialation;
			accelerationToUse = this.airAcc() * this.timeDialation;
		}
		// Apply friction
		this.velX -= this.velX * frictionToUse;
		// Move from input
		if(this.playerInput.left){
			if(this.velX <= 0 || !this.hitBottom){
				this.velX -= accelerationToUse;
			}
			else{
				this.velX = -this.velX * this.pivotSpeed;
			}
			if(!this.dashing)
				this.direction = 'left';
		}
		if(this.playerInput.right){
			if(this.velX >= 0 || !this.hitBottom){
				this.velX += accelerationToUse;
			}
			else{
				this.velX = -this.velX * this.pivotSpeed;
			}
			if(!this.dashing)
				this.direction = 'right';
		}

		// Dashing
		if(this.playerInput.dash && this.canDash && !this.hitBottom){
			this.dashing = true;
			this.canDash = false;
			this.velY *= 0.5;
		}

		if(this.dashTimer >= this.dashLength){
			this.dashing = false;
			this.velX *= 0.2;
			this.dashTimer = 0;
		}

		if(this.dashing){
			this.dashTimer += 1 * this.timeDialation;
			if(this.direction == 'right'){
				this.velX = this.dashSpeed;
			}
			else{
				this.velX = -this.dashSpeed;
			}
		}

		if(this.hitBottom){
			this.canDash = true;
			this.dashing = false;
			this.dashTimer = 0;
		}

		// Stop x velocity on walls
		if(this.hitRight && this.velX > 0)
			this.velX = 0;
		if(this.hitLeft && this.velX < 0)
			this.velX = 0;

		// Stop y velocity on ground
		if(this.hitBottom && this.velY > 0)
			this.velY = 0;

		// Hit cooldown
		if(this.hitCooldown > 0){
			this.hitCooldown -= 1 * this.timeDialation;
		}

		var slowMo = false;
		// Interaction with other players
		for (var i = 0; i < this.gameWorld.players.length; i++) {
			var playerToCheck = this.gameWorld.players[i];
			if(playerToCheck != this){
				// Slow-mo if this player is dashing
				if(this.dashing == true && getDistance(this.centerX(), playerToCheck.centerX()) < 200 && getDistance(this.centerY(), playerToCheck.centerY()) < 64){
					if(playerToCheck.hitCooldown <= 0){
						slowMo = true;
						this.dashTimer -= 0.5 * this.timeDialation;
					}
				}

				// Slow-mo if other player is dashing
				if(playerToCheck.dashing == true && getDistance(this.centerX(), playerToCheck.centerX()) < 200 && getDistance(this.centerY(), playerToCheck.centerY()) < 64){
					if(this.hitCooldown <= 0){
						slowMo = true;
					}
				}

				// Dash contact
				if(this.rectangle.isIntersecting(playerToCheck.rectangle) && this.dashing){
					if(playerToCheck.dashing){
						if(playerToCheck.direction == 'right'){
							playerToCheck.velX = -playerToCheck.dashSpeed;
						}
						else{
							playerToCheck.velX = playerToCheck.dashSpeed;
						}
						playerToCheck.canDash = true;
						playerToCheck.dashing = false;
						playerToCheck.dashTimer = 0;
						playerToCheck.moveCooldown = 5;
						
						if(this.direction == 'right'){
							this.velX = -this.dashSpeed;
						}
						else{
							this.velX = this.dashSpeed;
						}
						this.canDash = true;
						this.dashing = false;
						this.dashTimer = 0;
						this.moveCooldown = 5;
					}
					else if(playerToCheck.hitCooldown <= 0){
						if(this.direction == 'right'){
							playerToCheck.velX = this.dashSpeed;
						}
						else{
							playerToCheck.velX = -this.dashSpeed;
						}
						playerToCheck.hitCooldown = playerToCheck.hitCooldownLength;
						playerToCheck.moveCooldown = playerToCheck.moveCooldownLength;
					}
				}
			}
		}

		if(slowMo){
			this.timeDialation = 0.05;
		}
		else{
			this.timeDialation = 1;
		}

		// Apply velocity to position
		this.x += this.velX * this.timeDialation;
		this.y += this.velY * this.timeDialation;

		// Update rectangle position
		this.rectangle.x = this.x;
		this.rectangle.y = this.y;
		
		// Update draw position
		this.drawX = this.x;
		this.drawY = this.y
	}

	extrapolateDrawPosition(){
		this.drawX = lerp(this.drawX, this.drawX + this.velX * this.timeDialation, this.extrapolationStrength);
		this.drawY = lerp(this.drawY, this.drawY + this.velY * this.timeDialation, this.extrapolationStrength);

		if(this.drawX < 0)
			this.drawX = 0;
		if(this.drawX + this.rectangle.width > this.gameWorld.width)
			this.drawX = this.gameWorld.width - this.rectangle.width;
		if(this.drawY < 0)
			this.drawX = 0;
		if(this.drawY + this.rectangle.height > this.gameWorld.height)
			this.drawY = this.gameWorld.height - this.rectangle.height;
	}
}