var hasStarted = false;

var gameWorld = null;
var player1 = null;
var player2 = null;
var gameCanvas = null;

var gameScale = 0.5;

var menuElement = null;
var gameWindow = null;
var hostCodeElement = null;

window.onkeydown = function(e) { 
  return !(e.keyCode == 32 && e.target == document.body);
}; 

document.addEventListener('DOMContentLoaded', function() {
	document.addEventListener('updateHostCode', (e) => onUpdateHostCode(e));
	document.addEventListener('start', startGame);
	document.addEventListener('net-tick',(e) => gameNetTick(e));
	document.addEventListener('reset',() => onReset());

	showMenu();
});

function showMenu(){
	menuElement = document.createElement('DIV');
	menuElement.innerHTML = 'Your ID: ';
	menuElement.id = 'menu';
	document.body.appendChild(menuElement);

	hostCodeElement = document.createElement('SPAN');
	if(localClient != null)
		hostCodeElement.innerHTML = localClient.id;
	hostCodeElement.id = 'hostCode';
	menuElement.appendChild(hostCodeElement);

	var hostCodeSeperator = document.createElement('P');
	menuElement.appendChild(hostCodeSeperator);

	var joinButton = document.createElement('BUTTON');
	joinButton.innerHTML = 'Join';
	joinButton.id = 'joinButton';
	menuElement.appendChild(joinButton);

	var joinInput = document.createElement('INPUT');
	joinInput.id = 'joinInput';
	menuElement.appendChild(joinInput);

	joinButton.addEventListener('click', () => {
		if(connection == null && localClient != null){
			setConnection(localClient.connect(joinInput.value));
			console.log('Connected to client');
		}
	});
}

function startGame(){
	if(menuElement != null){
		document.body.removeChild(menuElement);
		menuElement = null;
	}

	gameWorld = new GameWorld(1000, 700);
	player1 = gameWorld.addPlayer((gameWorld.width / 8) - 32, 0, 'right', 'red');
	player2 = gameWorld.addPlayer(gameWorld.width - (gameWorld.width / 8), 0, 'left', 'blue');

	gameWorld.addRectangle(200, 16, (gameWorld.width/2) - 100, 500);
	gameWorld.addRectangle(200, 16, gameWorld.width - 200, 400);
	gameWorld.addRectangle(200, 16, 0, 400);

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
	gameWindow = gameCanvas.canvas;
	hasStarted = true;

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
	if(!hasStarted)
		return;

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
		context.drawImage(playerToDraw.spriteSheet, 32 * playerToDraw.spriteFrame, spriteYOffset, 32, 16, (playerToDraw.drawX  - 48)  * gameScale, (playerToDraw.drawY - 12) * gameScale, 32 * 4 * gameScale, 16 * 4 * gameScale);

		drawTriangle((playerToDraw.drawX + 16) * gameScale, (playerToDraw.drawY - 20) * gameScale, 10, 10, playerToDraw.color, context);
	}
	context.font = '32px Arial';
	context.fillText(player1.score.toString() + ' : ' + player2.score.toString(), 10 * gameScale, 50 * gameScale);

	setTimeout(draw, 1000/120);
}

function drawTriangle(x, y, width, height, color, context){
	context.fillStyle = color;
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(x + width, y - height);
	context.lineTo(x - width, y - height);
	context.fill();
	context.fillStyle = 'black';
}

function onReset(){
	hasStarted = false;
	if(gameWindow != null){
		document.body.removeChild(gameWindow);
		gameWindow = null;
	};
	showMenu();
}

function onUpdateHostCode(e){
	hostCodeElement.innerHTML = e.newHostCode;
}