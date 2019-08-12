var gameWorld;
var player1;
var player2;
var gameCanvas;

var player1DrawX;
var player1DrawY;
var player2DrawX;
var player2DrawY;

var player1LastX;
var player1LastY;
var player2LastX;
var player2LastY;

$(document).ready(function() {
	$(document).on('start', startGame);
	$(document).on('start-tick', startNetTick);
	$(document).on('net-tick', gameNetTick);
	$(document).on('end-tick', endNetTick);
});

function startGame(){
	gameWorld = new GameWorld(500, 500);
	player1 = gameWorld.addPlayer(0, 0);
	player2 = gameWorld.addPlayer(300, 0);

	player1DrawX = player1.x;
	player1DrawY = player1.y;
	player2DrawX = player2.x;
	player2DrawY = player2.y;

	gameCanvas = {
		canvas : document.createElement('canvas'),
		init : function() {
			this.canvas.width = gameWorld.width;
			this.canvas.height = gameWorld.height;
			this.context = this.canvas.getContext('2d');
			document.body.appendChild(this.canvas);
		},
		clear : function(){
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}
	gameCanvas.init();
	gameTick();
}

function startNetTick(){

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
	player1DrawX = player1.x;
	player1DrawY = player1.y;
	player2DrawX = player2.x;
	player2DrawY = player2.y;

	//draw();
}

function endNetTick(){

}

function gameTick(){
	var extrapolationStrength = 0.2;
	player1DrawX = (player1DrawX)*lerpAmount + (player1DrawX + player1.velX)*(1-extrapolationStrength);
	player1DrawY = (player1DrawY)*lerpAmount + (player1DrawY + player1.velY)*(1-extrapolationStrength);
	player2DrawX = (player2DrawX)*lerpAmount + (player2DrawX + player2.velX)*(1-extrapolationStrength);
	player2DrawY = (player2DrawY)*lerpAmount + (player2DrawY + player2.velY)*(1-extrapolationStrength);

	if(player1DrawX < 0)
		player1DrawX = 0;
	if(player1DrawX + player1.rectangle.width > gameWorld.width)
		player1DrawX = gameWorld.width - player1.rectangle.width;
	if(player1DrawY < 0)
		player1DrawY = 0;
	if(player1DrawY + player1.rectangle.height > gameWorld.height)
		player1DrawY = gameWorld.height - player1.rectangle.height;

	if(player2DrawX < 0)
		player2DrawX = 0;
	if(player2DrawX + player2.rectangle.width > gameWorld.width)
		player2DrawX = gameWorld.width - player2.rectangle.width;
	if(player2DrawY < 0)
		player2DrawY = 0;
	if(player2DrawY + player2.rectangle.height > gameWorld.height)
		player2DrawY = gameWorld.height - player2.rectangle.height;

	draw();
	setTimeout(gameTick, 1000/60);
}

function draw(){
	gameCanvas.clear();

	context = gameCanvas.context;
	// Draw all rectangles
	for(var i = 0; i < gameWorld.rectangles.length; i++){
	  	context.fillStyle = 'black';
	  	context.fillRect(gameWorld.rectangles[i].x, gameWorld.rectangles[i].y, gameWorld.rectangles[i].width, gameWorld.rectangles[i].height);
	}
	/*
	for(var i = 0; i < gameWorld.players.length; i++){
	 	context.fillStyle = 'red';
	  	context.fillRect(gameWorld.players[i].rectangle.x, gameWorld.players[i].rectangle.y, gameWorld.players[i].rectangle.width, gameWorld.players[i].rectangle.height);
	}
	*/

	context.fillStyle = 'red';
	context.fillRect(player1DrawX, player1DrawY, player1.rectangle.width, player1.rectangle.height);

	context.fillStyle = 'red';
	context.fillRect(player2DrawX, player2DrawY, player2.rectangle.width, player2.rectangle.height);
}