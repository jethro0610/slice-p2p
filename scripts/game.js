var gameWorld;
var player1;
var player2;
var gameCanvas;

var gameScale = 0.5;

window.onkeydown = function(e) { 
  return !(e.keyCode == 32 && e.target == document.body);
}; 

$(document).ready(function() {
	$(document).on('start', startGame);
	$(document).on('net-tick', gameNetTick);
});

function startGame(){
	$('#menu').remove();
	gameWorld = new GameWorld(1000, 500);
	player1 = gameWorld.addPlayer((gameWorld.width / 8) - 32, 0);
	player2 = gameWorld.addPlayer(gameWorld.width - (gameWorld.width / 8), 0);
	player2.direction = 'left';

	gameWorld.addRectangle(200, 16, (gameWorld.width/2) - 100, 400);
	gameWorld.addRectangle(200, 16, gameWorld.width - 200, 300);
	gameWorld.addRectangle(200, 16, 0, 300);

	gameCanvas = {
		canvas : document.createElement('canvas'),
		init : function() {
			this.canvas.setAttribute('id', 'gameWindow');
			this.canvas.width = gameWorld.width * gameScale;
			this.canvas.height = gameWorld.height * gameScale;
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
	  	context.fillRect(gameWorld.rectangles[i].x * gameScale, gameWorld.rectangles[i].y * gameScale, gameWorld.rectangles[i].width * gameScale, gameWorld.rectangles[i].height * gameScale);
	}
	// Draw all players
	for(var i = 0; i < gameWorld.players.length; i++){
		var playerToDraw = gameWorld.players[i];
		var spriteYOffset = 0;
		if(playerToDraw.direction == 'left')
			spriteYOffset = 17;
	 	playerToDraw.drawTick();
	 	if(playerToDraw.slowMo){
	 		context.fillStyle = 'red';
			context.fillRect(gameWorld.players[i].drawX * gameScale, gameWorld.players[i].drawY * gameScale, gameWorld.players[i].rectangle.width * gameScale, gameWorld.players[i].rectangle.height * gameScale);
		}
		context.drawImage(playerToDraw.spriteSheet, 32 * playerToDraw.spriteFrame, spriteYOffset, 32, 16, (playerToDraw.drawX  - 48)  * gameScale, (playerToDraw.drawY - 12) * gameScale, 32 * 4 * gameScale, 16 * 4 * gameScale);
	}
	context.font = '32px Arial';
	context.fillText(player1.score.toString() + ' : ' + player2.score.toString(), 10 * gameScale, 50 * gameScale);

	setTimeout(draw, 1000/120);
}