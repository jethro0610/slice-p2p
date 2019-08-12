var gameWorld;
var player1;
var player2;
var gameCanvas;

$(document).ready(function() {
	$(document).on('start', startGame);
	$(document).on('net-tick', gameNetTick);
});

function startGame(){
	gameWorld = new GameWorld(1000, 500);
	player1 = gameWorld.addPlayer(0, 0);
	player2 = gameWorld.addPlayer(300, 0);
	player2.direction = 'left';

	gameWorld.addRectangle(200, 16, (gameWorld.width/2) - 100, 400);
	gameWorld.addRectangle(200, 16, gameWorld.width - 200, 300);
	gameWorld.addRectangle(200, 16, 0, 300);

	gameCanvas = {
		canvas : document.createElement('canvas'),
		init : function() {
			this.canvas.width = gameWorld.width;
			this.canvas.height = gameWorld.height;
			this.context = this.canvas.getContext('2d');
			this.context.imageSmoothingEnabled = false;
			document.body.appendChild(this.canvas);
		},
		clear : function(){
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}
	gameCanvas.init();
	draw();
}

function gameNetTick(e){
	if(isHost){
		player1.playerInput = e.localInputThisTick;
		player2.playerInput = e.remoteInputThisTick;
	}
	else{
		player1.playerInput = e.remoteInputThisTick;
		player2.playerInput = e.localInputThisTick;
	}

	gameWorld.tick();
}

function draw(){
	gameCanvas.clear();

	context = gameCanvas.context;
	// Draw all rectangles
	for(var i = 0; i < gameWorld.rectangles.length; i++){
	  	context.fillStyle = 'black';
	  	context.fillRect(gameWorld.rectangles[i].x, gameWorld.rectangles[i].y, gameWorld.rectangles[i].width, gameWorld.rectangles[i].height);
	}
	// Draw all players
	for(var i = 0; i < gameWorld.players.length; i++){
		var playerToDraw = gameWorld.players[i];
		var spriteYOffset = 0;
		if(playerToDraw.direction == 'left')
			spriteYOffset = 17;
	 	playerToDraw.drawTick();
	 	//context.fillStyle = 'red';
		//context.fillRect(gameWorld.players[i].drawX, gameWorld.players[i].drawY, gameWorld.players[i].rectangle.width, gameWorld.players[i].rectangle.height);
		context.drawImage(playerToDraw.spriteSheet, 32 * playerToDraw.spriteFrame, spriteYOffset, 32, 16, playerToDraw.drawX  - 48, playerToDraw.drawY, 32 * 4, 16 * 4);
	}
	setTimeout(draw, 1000/120);
}