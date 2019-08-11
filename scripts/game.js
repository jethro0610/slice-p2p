var gameWorld;
var player1;
var player2;
var gameCanvas;

var lastX1;
var lastY1;
var lastX2;
var lastY2;

var lastVX1;
var lastVY1;
var lastVX2;
var lastVY2;

$(document).ready(function() {
	$(document).on('start', startGame);
	$(document).on('tick', tick);
	$(document).on('newInput', onNewInput);
});

function startGame(){
	gameWorld = new GameWorld(500, 500);
	player1 = gameWorld.addPlayer(0, 0);
	player2 = gameWorld.addPlayer(300, 0);

	lastX1 = player1.x;
	lastY1 = player1.y;
	lastX2 = player2.x;
	lastY2 = player2.y;

	lastVX1 = 0;
	lastVY1 = 0;
	lastVX2 = 0;
	lastVY2 = 0;

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
}

function onNewInput(){
	player1.x = lastX1;
	player1.y = lastY1;
	player2.x = lastX2;
	player2.y = lastY2;

	player1.velX = lastVX1;
	player1.velY = lastVY1;
	player2.velX = lastVX2;
	player2.velY = lastVY2;
}


function tick(e){
	if(isHost){
		player1.playerInput = e.localInputThisTick;
		player2.playerInput = e.remoteInputThisTick;
	}
	else{
		player1.playerInput = e.remoteInputThisTick;
		player2.playerInput = e.localInputThisTick;
	}

	gameWorld.tick();

	if(e.hasInput){
		lastX1 = player1.x;
		lastY1 = player1.y;
		lastX2 = player2.x;
		lastY2 = player2.y;

		lastVX1 = player1.velX;
		lastVY1 = player1.velY;
		lastVX2 = player2.velX;
		lastVY2 = player2.velY;
	}

	draw();
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
	 	context.fillStyle = 'red';
	  	context.fillRect(gameWorld.players[i].rectangle.x, gameWorld.players[i].rectangle.y, gameWorld.players[i].rectangle.width, gameWorld.players[i].rectangle.height);
	}
}