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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getDistance(point1, point2){
	return Math.abs(point1 - point2);
}

class GameWorld {
	constructor(width, height, windowScale){
		this.windowScale = windowScale
		this.width = width;
		this.height = height;
		this.rectangles = [];
		this.players = [];
		this.roundManager = new RoundManager(this);
		this.resetToNeutral = true;
		this.canvas = document.createElement('canvas');

		this.canvas.setAttribute('id', 'gameWindow');
		this.canvas.width = this.width * this.windowScale;
		this.canvas.height = this.height * this.windowScale;
		this.context = this.canvas.getContext('2d');
		this.context.imageSmoothingEnabled = false;
		document.body.appendChild(this.canvas);

		this.draw();
	}

	clearCanvas() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
		this.roundManager.tick();
		for (var i = 0; i < this.players.length; i++) {
			this.players[i].tick();
		}
	}

	draw(){
		this.clearCanvas();

		// Draw all rectangles
		for(var i = 0; i < this.rectangles.length; i++){
		  	this.context.fillStyle = 'black';
		  	this.context.fillRect(this.rectangles[i].x * this.windowScale, this.rectangles[i].y * this.windowScale, this.rectangles[i].width * this.windowScale, this.rectangles[i].height * this.windowScale);
		}

		// Draw round UI
		this.roundManager.draw();

		// Draw all players
		for(var i = 0; i < this.players.length; i++){
			this.players[i].draw();
		}

		setTimeout(() => this.draw(), 1000/120);
	}

	drawTriangle(x, y, width, height, color, context){
		context.fillStyle = color;
		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(x + width, y - height);
		context.lineTo(x - width, y - height);
		context.fill();
		context.fillStyle = 'black';
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

class RoundManager{
	constructor(newGameWorld){
		this.gameWorld = newGameWorld;
		this.roundState = 'startGameIntro';

		this.startGameTimer = 0;
		this.startGameLength = 300;
		this.displayStartText = false;

		this.endRoundTimer = 0;
		this.endRoundLength = 120;

		this.endGameTimer = 0;
		this.endGameLength = 300;
		this.winningPlayer = null;

		this.disableInput = true;
		this.scoreText = '0 - 0';

		this.winningScore = 10;
	}

	tick() {
		if(this.roundState == 'startGameIntro'){
			this.startGameIntroTick();
		}
		else if(this.roundState == 'startGameCount'){
			this.startGameCountTick();
		}
		else if(this.roundState == 'intro'){
			this.introTick();
		}
		else if(this.roundState == 'endRound'){
			this.endRoundTick()
		}
		else if(this.roundState == 'endGame'){
			this.endGameTick()
		}

		if (this.endRoundTimer >= this.endRoundLength/2)
			this.updateScoreText()
	}

	playerHitDash(dashingPlayer, hitPlayer){
		dashingPlayer.score += 1;
		if(dashingPlayer.score >= this.winningScore)
			this.winningPlayer = dashingPlayer;
		this.stateEndRound();
	}

	updateScoreText() {
		this.scoreText = '';
		for (var i = 0; i < this.gameWorld.players.length; i++) {
			this.scoreText += this.gameWorld.players[i].score.toString();
			if(i != this.gameWorld.players.length - 1)
				this.scoreText += ' - ';
		}
	}
	//----------------------------------------------------
	startGameIntroTick() {
		for (var i = 0; i < this.gameWorld.players.length; i++) {
			if (!this.gameWorld.players[i].hitBottom)
				return;
		}
		this.stateStartGameCount();
	}

	startGameCountTick(){
		this.startGameTimer += 1;

		if(this.startGameTimer >= this.startGameLength){
			this.endRoundTimer = 0;
			this.stateInRound();
			this.displayStartText = true;
			setTimeout(() => {
				this.displayStartText = false;
			}, 1000)
		}
	}

	introTick() {
		for (var i = 0; i < this.gameWorld.players.length; i++) {
			if (!this.gameWorld.players[i].hitBottom)
				return;
		}
		this.stateInRound();
	}

	endRoundTick(){
		if(this.gameWorld.resetToNeutral)
			this.endRoundTimer += 1;

		if(this.endRoundTimer >= this.endRoundLength){
			this.endRoundTimer = 0;
			if(this.winningPlayer == null){
				this.stateIntro();
			}
			else{
				this.stateEndGame();
			}
		}
	}

	endGameTick(){
		this.endGameTimer += 1;

		if(this.endGameTimer >= this.endGameLength){
			reset();
		}
	}
	//----------------------------------------------------
	stateStartGameCount(){
		this.roundState = 'startGameCount';
	}
	stateIntro(){
		this.roundState = 'intro';
		for (var i = 0; i < this.gameWorld.players.length; i++) {
			this.gameWorld.players[i].resetNextTick = true;
		}
		this.disableInput = true;
	}

	stateInRound(){
		this.roundState = 'inRound';
		this.disableInput = false;
	}

	stateEndRound(){
		this.roundState = 'endRound';
		this.disableInput = true;
	}

	stateEndGame(){
		this.roundState = 'endGame';
		this.disableInput = true;
	}
	//----------------------------------------------------
	draw(){
		this.gameWorld.context.textBaseline = 'middle';
	  	this.gameWorld.context.textAlign = "center";

	  	if(this.roundState != 'startGameIntro' && this.roundState != 'startGameCount'){
			if(this.roundState != 'endRound'){
				this.gameWorld.context.font = '32px Arial';
				this.gameWorld.context.fillText(this.scoreText, (this.gameWorld.width / 2) * this.gameWorld.windowScale, 50 * this.gameWorld.windowScale);
			}
			else{
				this.gameWorld.context.font = '64px Arial';
				this.gameWorld.context.fillText(this.scoreText, (this.gameWorld.width / 2) * this.gameWorld.windowScale, (this.gameWorld.height / 2) * this.gameWorld.windowScale);
			}
		}
		else{
			if(this.startGameTimer > this.startGameLength/8){
		  		this.gameWorld.context.font = '64px Arial';
				this.gameWorld.context.fillText('Ready...', (this.gameWorld.width / 2) * this.gameWorld.windowScale, (this.gameWorld.height / 2) * this.gameWorld.windowScale);
	  		}
		}

		if(this.displayStartText){
			this.gameWorld.context.font = '64px Arial';
			this.gameWorld.context.fillText('Slice!', (this.gameWorld.width / 2) * this.gameWorld.windowScale, (this.gameWorld.height / 2) * this.gameWorld.windowScale);
		}

		if(this.roundState == 'endGame'){
			this.gameWorld.context.font = '64px Arial';
			this.gameWorld.context.fillText(capitalizeFirstLetter(this.winningPlayer.color) + ' wins!', (this.gameWorld.width / 2) * this.gameWorld.windowScale, (this.gameWorld.height / 2) * this.gameWorld.windowScale);
		}
	}
}

class Player {
	constructor(x, y, spawnDirection, color, gameWorld) {
		this.gameWorld = gameWorld;
		this.roundManager = this.gameWorld.roundManager;
		this.x = x;
		this.y = y;
		this.spawnX = x;
		this.spawnY = y;
		this.rectangle = new Rectangle(32, 52, this.x, this.y);
		this.color = color;

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

		this.resetNextTick = false;
		this.score = 0;
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
		if(this.rectangle.right() >= this.gameWorld.width){
			this.hitRight = true;
			this.x = this.gameWorld.width - this.rectangle.width;
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
		if(this.rectangle.bottom() >= this.gameWorld.height){
			if(this.velY >= 0){
				this.hitBottom = true;
				this.y = this.gameWorld.height - this.rectangle.height;
				this.velY = 0;
			}
		}
	}

	jump(){
		this.velY = -this.jumpStrength;
	}

	tick() {
		if(this.roundManager.roundState == 'endGame')
			return;

		this.updateCollision();

		// Input
		if(!this.slowMo && !this.roundManager.disableInput){
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
			if(this.roundManager.roundState != 'endRound' && !this.hitDash){
				this.dashCooldown = this.dashCooldownLength;
			}
			else if(this.roundManager.roundState == 'endRound'){
				this.dashCooldown = this.roundManager.endRoundLength;
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

		if(this.hitBottom && this.roundManager.roundState != 'endRound'){
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
						// Clashes
						playerToCheck.clash();
						this.clash();
					}
					else if(!playerToCheck.hitByDash){
						// Contact
						this.roundManager.playerHitDash(this, playerToCheck);

						var knockbackMult = 1;
						if(this.gameWorld.resetToNeutral)
							knockbackMult = 2;

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

		// Set speed for slow mo
		if(this.slowMo){
			this.timeDialation = this.slowMoSpeed;
		}
		else{
			this.timeDialation = this.normalSpeed;
		}

		// Reset to neutral
		if(this.resetNextTick){
			this.resetNextTick = false;
			this.reset();
		}

		// Apply velocity to position
		this.x += this.velX * this.timeDialation;
		this.y += this.velY * this.timeDialation;

		// Update rectangle position
		this.rectangle.x = this.x;
		this.rectangle.y = this.y;
		
		// Update draw position
		this.drawX = this.x;
		this.drawY = this.y;
	}

	clash(){
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

	drawTick(){
		if(this.roundManager.roundState == 'endGame')
			return;

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

	draw(){
		this.drawTick();

		var spriteYOffset = 0;
		if(this.direction == 'left')
			spriteYOffset = 17;
		this.drawTick();
		this.gameWorld.context.drawImage(this.spriteSheet, 
			32 * this.spriteFrame, spriteYOffset, 32, 16, 
			(this.drawX  - 48)  * this.gameWorld.windowScale, 
			(this.drawY - 12) * this.gameWorld.windowScale, 
			32 * 4 * this.gameWorld.windowScale, 
			16 * 4 * this.gameWorld.windowScale);

		this.gameWorld.drawTriangle((this.drawX + 16) * this.gameWorld.windowScale, (this.drawY - 20) * this.gameWorld.windowScale, 10, 10, this.color, this.gameWorld.context);
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
	}
}