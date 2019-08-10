var gameWorld;
var player1;
var player2;
var gameCanvas;

$(document).ready(function() {
	$(document).on('start', startGame);
	$(document).on('tick', tick);
});

function startGame(){
	gameWorld = new GameWorld(500, 500);
	player1 = gameWorld.addPlayer(0, 0);
	player2 = gameWorld.addPlayer(300, 0);

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

function tick(e){
	if(isHost == true){
		player1.playerInput = e.localInputThisTick;
		player2.playerInput = e.remoteInputThisTick;
	}
	else{
		player1.playerInput = e.remoteInputThisTick;
		player2.playerInput = e.localInputThisTick;
	}
	gameWorld.tick();

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