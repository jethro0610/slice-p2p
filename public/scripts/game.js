var hasStarted = false;

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
	$(document).on('reset', onReset);

	showMenu();
});

function showMenu(){
	var menuDiv = document.createElement('DIV');
	menuDiv.innerHTML = 'Your ID: ';
	menuDiv.id = 'menu';
	document.body.appendChild(menuDiv);

	var hostCode = document.createElement('SPAN');
	if(localClient != null)
		hostCode.innerHTML = localClient.id;
	hostCode.id = 'hostCode';
	menuDiv.appendChild(hostCode);

	var paragraphSeperator = document.createElement('P');
	menuDiv.appendChild(paragraphSeperator);

	var joinButton = document.createElement('BUTTON');
	joinButton.innerHTML = 'Join';
	joinButton.id = 'joinButton';
	menuDiv.appendChild(joinButton);

	var joinInput = document.createElement('INPUT');
	joinInput.id = 'joinInput';
	menuDiv.appendChild(joinInput);

	$('#joinButton').click(function (){
		if(connection == null && localClient != null){
			setConnection(localClient.connect($('#joinInput').val()));
			console.log('Connected to client');
		}
	});
}

function startGame(){
	$('#menu').remove();
	gameWorld = new GameWorld(1000, 500);
	player1 = gameWorld.addPlayer((gameWorld.width / 8) - 32, 0, 'right', 'red');
	player2 = gameWorld.addPlayer(gameWorld.width - (gameWorld.width / 8), 0, 'left', 'blue');

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
	 	//context.fillStyle = 'red';
		//context.fillRect(gameWorld.players[i].drawX * gameScale, gameWorld.players[i].drawY * gameScale, gameWorld.players[i].rectangle.width * gameScale, gameWorld.players[i].rectangle.height * gameScale);
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
	$('#gameWindow').remove();
	showMenu();
}