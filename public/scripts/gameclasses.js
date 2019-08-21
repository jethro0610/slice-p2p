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
		this.resetToNeutral = true;
	}

	addPlayer(x, y, spawnDirection, color) {
		var newPlayer = new Player(x, y, spawnDirection, color, this);
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
	constructor(x, y, spawnDirection, color, gameWorld) {
		this.gameWorld = gameWorld;
		this.x = x;
		this.y = y;
		this.spawnX = x;
		this.spawnY = y;
		this.rectangle = new Rectangle(32, 52, this.x, this.y);
		this.color = color;
		this.firstHitBottom = false;

		this.hitRight= false;
		this.hitLeft = false;
		this.hitTop = false;
		this.hitBottom = false;

		this.maxMoveSpeed = 10;
		this.groundFriction = 0.1;
		this.airFriction = 0.05;

		this.pivotSpeed = 1.0;

		this.gravitySpeed = 1;
		this.maxGravity = 15;
		this.jumpStrength = 20;

		this.velX = 0;
		this.velY = 0;

		this.spawnDirection = spawnDirection
		this.direction = spawnDirection;

		this.playerInput = new Inputs();
		this.inputToUse = new Inputs();
		this.inputUpLastFrame = false;
		this.inputDashLastFrame = false;

		this.dashSpeed = 30;
		this.dashLength = 7;
		this.dashCooldown = 0;
		this.dashCooldownLength = 40;
		this.dashTimer = 0;
		this.canDash = true;
		this.dashing = false;

		this.hitDash = false;
		this.hitByDash = false;

		this.hitCooldown = 0;
		this.hitCooldownLength = 20;

		this.slowMo = false;
		this.normalSpeed = 0.5;
		this.slowMoSpeed = 0.1 * this.normalSpeed;
		this.timeDialation = 0.5;

		this.drawX = this.x;
		this.drawY = this.y;
		this.extrapolationStrength = 0.5;

		this.animState = 'idle';
		this.spriteSheet = new Image();
		this.spriteSheet.src = 'sprites/slicePlayer.ss.png';
		this.spriteFrame = 0;

		this.runStateTick = 0;
		this.canDoubleJump = true;
		this.canJump = true;

		this.score = 0;

		this.endRound = false;
		this.endRoundTimer = 0;
		this.endRoundLength = 120;
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

		// Drop through when holding down
		var dropThrough = false;
		if(this.inputToUse.down)
			dropThrough = true;
		if(this.dashing)
			dropThrough = false;

		// Detect collision with rectangles
		for (var i = 0; i < this.gameWorld.rectangles.length; i++) {
			var rectangleToCheck = this.gameWorld.rectangles[i];
			// If player is within vertical bounds of a rectangle
			if(this.rectangle.bottom() >= rectangleToCheck.top() && this.rectangle.top() <= rectangleToCheck.bottom()){
				if(this.rectangle.right() >= rectangleToCheck.left && this.rectangle.right() <= rectangleToCheck.left() + this.velX && this.rectangle.left() <= rectangleToCheck.left()){
					this.hitRight = true;
					this.x = rectangleToCheck.left() - this.rectangle.width;
				}

				if(this.rectangle.left() <= rectangleToCheck.right() && this.rectangle.right() <= rectangleToCheck.left() + this.velX && this.rectangle.right() >= rectangleToCheck.right()){
					this.hitLeft = true;
					this.x = rectangleToCheck.right();
				}
			}
			// If player is within horizontal bounds of a rectangle
			if(this.rectangle.right() >= rectangleToCheck.left() && this.rectangle.left() <= rectangleToCheck.right()){
				if(this.rectangle.bottom() >= rectangleToCheck.top() && !dropThrough && this.velY >= 0 && this.rectangle.top() <= rectangleToCheck.top()){
					this.hitBottom = true;
					this.y = rectangleToCheck.top() - this.rectangle.height;
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
		}
		if(this.rectangle.bottom() >= gameWorld.height){
			if(this.velY >= 0){
				this.hitBottom = true;
				this.y = gameWorld.height - this.rectangle.height;
				this.velY = 0;
			}
		}
	}

	jump(){
		this.velY = -this.jumpStrength;
	}

	tick() {
		this.updateCollision();

		// Input
		if(!this.slowMo && !this.endRound && this.firstHitBottom){
			this.inputToUse = this.playerInput;
		}
		else{
			this.inputToUse = new Inputs();
		}

		// Jumping
		if(this.inputToUse.up && !this.dashing){
			if(this.canJump && !this.slowMo && this.canDash && this.dashCooldown >= 0){
				this.canJump = false;
				this.jump();
				if(!this.hitBottom){
					if(this.inputToUse.left && !this.inputToUse.right){
						if(this.velX > 0)
							this.velX = -this.velX * 1.5;
					}
					else if(this.inputToUse.right && !this.inputToUse.left){
						if(this.velX < 0)
							this.velX = -this.velX * 1.5;
					}
				}
			}
			else if(this.canDoubleJump && !this.inputUpLastFrame && this.canDash && this.dashCooldown >= 0){
				this.canDoubleJump = false;
				this.jump();
				if(this.inputToUse.left && !this.inputToUse.right){
					if(this.velX > 0)
						this.velX = -this.velX * 1.5;
				}
				else if(this.inputToUse.right && !this.inputToUse.left){
					if(this.velX < 0)
						this.velX = -this.velX * 1.5;
				}
			}
		}
		this.inputUpLastFrame = this.playerInput.up;

		// Gravity
		if(!this.dashing && this.dashCooldown <= 0){
			this.velY += this.gravitySpeed * this.timeDialation;
			if(this.velY > this.maxGravity)
				this.velY = this.maxGravity;
		}

		// Movement
		var frictionToUse;
		var accelerationToUse;
		if(this.hitBottom){
			this.firstHitBottom = true;
			this.canDoubleJump = true;
			this.canJump = true;
			frictionToUse = this.groundFriction * this.timeDialation;
			accelerationToUse = this.groundAcc() * this.timeDialation;
		}
		else{
			frictionToUse = this.airFriction * this.timeDialation;
			accelerationToUse = this.airAcc() * this.timeDialation;
		}
		if(this.dashing || this.dashCooldown > 0){
			frictionToUse = 0;
			accelerationToUse = 0;
		}
		// Apply friction
		this.velX -= this.velX * frictionToUse;
		// Move from input
		if(this.inputToUse.left && !this.inputToUse.right && this.canDash){
			if(this.velX <= 0 || !this.hitBottom){
				this.velX -= accelerationToUse;
			}
			else{
				this.velX = -this.velX * this.pivotSpeed;
			}
			if(!this.dashing && this.canDash)
				this.direction = 'left';
		}
		if(this.inputToUse.right && !this.inputToUse.left && this.canDash){
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
		if(this.inputToUse.dash && !this.inputDashLastFrame && this.canDash && !this.hitBottom){
			this.dashing = true;
			this.canDash = false;
			this.velY *= 0.4;
			if(this.inputToUse.down)
				this.velY += this.jumpStrength * 0.4;
		}

		if(this.dashTimer >= this.dashLength){
			this.dashing = false;
			this.dashTimer = 0;
			this.velX = this.velX * 0.01;
			this.velY = this.velY * 0.1;
			if(!this.endRound && !this.hitDash){
				this.dashCooldown = this.dashCooldownLength;
			}
			else if(this.endRound){
				this.dashCooldown = this.endRoundLength;
			}
			else{
				this.dashCooldown = this.dashCooldownLength / 4;
			}
		}

		if(this.dashCooldown > 0){
			this.dashCooldown -= 1 * this.timeDialation;
		}
		else{
			this.dashCooldown = 0;
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

		if(this.hitBottom && !this.endRound){
			this.canDash = true;
			this.dashing = false;
			this.dashTimer = 0;
			this.dashCooldown = 0;
		}
		this.inputDashLastFrame = this.playerInput.dash;

		// Stop y velocity on ground
		if(this.hitBottom && this.velY > 0)
			this.velY = 0;

		// Hit cooldown
		if(this.hitByDash){
			this.hitCooldown += 1 * this.timeDialation;
		}
		if(this.hitCooldown >= this.hitCooldownLength){
			this.hitCooldown = 0;
			this.hitByDash = false;
		}

		// Interaction with other players
		this.slowMo = false;
		for (var i = 0; i < this.gameWorld.players.length; i++) {
			var playerToCheck = this.gameWorld.players[i];
			if(playerToCheck != this){
				// Slow-mo if this player is dashing
				if(this.dashing == true && getDistance(this.centerX(), playerToCheck.centerX()) < 200 && getDistance(this.centerY(), playerToCheck.centerY()) < 64){
					if(!playerToCheck.hitByDash){
						if(this.direction == 'right' && this.x - playerToCheck.x < 0 || this.direction == 'left' && this.x - playerToCheck.x > 0){
							if(!playerToCheck.dashing || playerToCheck.direction != this.direction){
								this.slowMo = true;
								this.dashTimer -= 0.5 * this.timeDialation;
							}
						}
					}
				}

				// Slow-mo if other player is dashing
				if(playerToCheck.dashing == true && getDistance(this.centerX(), playerToCheck.centerX()) < 200 && getDistance(this.centerY(), playerToCheck.centerY()) < 64){
					if(!this.hitByDash){
						if(playerToCheck.direction == 'right' && playerToCheck.x - this.x < 0 || playerToCheck.direction == 'left' && playerToCheck.x - this.x > 0){
							if(!this.dashing || this.direction != playerToCheck.direction){
								this.slowMo = true;
							}
						}
					}
				}

				// Dash contact
				if(this.rectangle.isIntersecting(playerToCheck.rectangle) && this.dashing){
					if(playerToCheck.dashing){
						// Clashes (have to do it on both players due to tick order)
						if(playerToCheck.direction == 'right'){
							playerToCheck.velX = -playerToCheck.dashSpeed;
						}
						else{
							playerToCheck.velX = playerToCheck.dashSpeed;
						}
						playerToCheck.canDash = true;
						playerToCheck.dashing = false;
						playerToCheck.dashTimer = 0;

						if(this.direction == 'right'){
							this.velX = -this.dashSpeed;
						}
						else{
							this.velX = this.dashSpeed;
						}
						this.canDash = true;
						this.dashing = false;
						this.dashTimer = 0;
					}
					else if(!playerToCheck.hitByDash){
						// Contact
						this.score += 1;

						var knockbackMult = 1;
						if(gameWorld.resetToNeutral){
							this.endRound = true;
							playerToCheck.endRound = true;
							knockbackMult = 2;
						}

						if(this.direction == 'right'){
							playerToCheck.velX = this.dashSpeed * knockbackMult;
						}
						else{
							playerToCheck.velX = -this.dashSpeed * knockbackMult;
						}
						playerToCheck.velY = -playerToCheck.jumpStrength;

						this.hitDash = true;
						playerToCheck.hitByDash = true;
						playerToCheck.canDash = true;
						playerToCheck.dashCooldown = 0;
					}
				}
			}
		}

		// End round resetting
		if(this.endRound){
			if(this.gameWorld.resetToNeutral)
				this.endRoundTimer += 1 * this.timeDialation;
		}
		if(this.endRoundTimer >= this.endRoundLength){
			this.endRoundTimer = 0;
			this.reset();
		}

		// Set speed for slow mo
		if(this.slowMo){
			this.timeDialation = this.slowMoSpeed;
		}
		else{
			this.timeDialation = this.normalSpeed;
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

	drawTick(){
		// Extrapolate draw position based on velocity
		this.drawX = lerp(this.drawX, this.drawX + this.velX * this.timeDialation, this.extrapolationStrength);
		this.drawY = lerp(this.drawY, this.drawY + this.velY * this.timeDialation, this.extrapolationStrength);

		// Keep draw position within window
		if(this.drawX < 0)
			this.drawX = 0;
		if(this.drawX + this.rectangle.width > this.gameWorld.width)
			this.drawX = this.gameWorld.width - this.rectangle.width;
		if(this.drawY < 0)
			this.drawy = 0;
		if(this.drawY + this.rectangle.height > this.gameWorld.height)
			this.drawY = this.gameWorld.height - this.rectangle.height;

		this.updateAnimState();

		if(this.animState == 'idle')
			this.spriteFrame = 0;

		if(this.animState == 'jump')
			this.spriteFrame = 1;

		if(this.animState == 'midFall')
			this.spriteFrame = 2;

		if(this.animState == 'fall')
			this.spriteFrame = 3;

		if(this.animState == 'dash')
			this.spriteFrame = 5;

		if(this.animState == 'endDash')
			this.spriteFrame = 8;

		if(this.animState == 'run'){
			this.runStateTick += this.timeDialation;
			if(this.runStateTick >= 10){
			this.spriteFrame += 1;
			this.runStateTick = 0;
			}
			if(this.spriteFrame < 4 || this.spriteFrame > 7){
				this.spriteFrame = 4;
			}
		}
	}

	updateAnimState(){
		if(!this.hitBottom){
			if(this.canDash){
				if(this.velY < 0){
					this.animState = 'jump';
				}
				else if(this.velY > 2){
					this.animState = 'fall';
				}
				else{
					this.animState = 'midFall'
				}
			}
		}
		
		if(this.dashCooldown > 0)
			this.animState = 'endDash';

		if(this.hitBottom){
			if(this.inputToUse.right && this.velX != 0 && !this.inputToUse.left || this.inputToUse.left && this.velX != 0 && !this.inputToUse.right){
				this.animState = 'run'
			}
			else if(!this.dashCooldown){
				this.animState = 'idle';
			}
		}

		if(this.dashing){
			this.animState = 'dash';
		}
	}

	reset(){
		this.x = this.spawnX;
		this.y = this.spawnY;
		this.velX = 0;
		this.velY = 0;
		this.direction = this.spawnDirection;
		this.firstHitBottom = false;

		this.drawX = this.x;
		this.drawY = this.y;

		this.canJump = true;
		this.canDoubleJump = true;
		this.dashing = false;
		this.dashTimer = 0;

		this.dashCooldown = 0;
		this.canDash = true;

		this.hitDash = false;
		this.hitByDash = false;
		this.hitCooldown = 0;

		this.slowMo = false;

		this.endRound = false;
	}
}