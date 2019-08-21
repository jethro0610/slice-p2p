var gameWorld = null;
var player1 = null;
var player2 = null;
var gameCanvas = null;

var gameScale = 0.5;

var menuElement = null;
var gameWindow = null;
var searchingPlayersElement = null;
var hostCodeElement = null;
var menuBlurbElement = null;
var menuBlurbText = '';

window.onkeydown = function(e) { 
  return !(e.keyCode == 32 && e.target == document.body);
}; 

document.addEventListener('DOMContentLoaded', function() {
	document.addEventListener('updateHostCode', (e) => onUpdateHostCode(e));

	document.addEventListener('start', startGame);
	document.addEventListener('net-tick',(e) => gameNetTick(e));

	document.addEventListener('lostConnection', () => onLostConnection());
	document.addEventListener('reset',() => onReset());

	document.addEventListener('updateSearchingPlayers', (e) => updateSearchingPlayers(e.count));

	showMenu();
});

function showMenu(){
	menuElement = document.createElement('DIV');
	menuElement.id = 'menu';
	document.body.appendChild(menuElement);
	//---------------------------------------------------
	var searchingPlayerMessage = document.createElement('SPAN');
	searchingPlayerMessage.innerHTML = 'Current match searches: ';
	searchingPlayerMessage.id = 'searchingPlayersMessage'
	menuElement.appendChild(searchingPlayerMessage);

	searchingPlayersElement = document.createElement('SPAN');
	searchingPlayersElement.innerHTML = '0';
	searchingPlayersElement.id = 'searchingPlayers'
	menuElement.appendChild(searchingPlayersElement);

	menuElement.appendChild(document.createElement('BR'));
	//---------------------------------------------------
	var hostCodeMessage = document.createElement('SPAN');
	hostCodeMessage.innerHTML = 'Your ID: ';
	menuElement.appendChild(hostCodeMessage);

	hostCodeElement = document.createElement('SPAN');
	if(localClient != null)
		hostCodeElement.innerHTML = localClient.id;
	hostCodeElement.id = 'hostCode';
	menuElement.appendChild(hostCodeElement);

	menuElement.appendChild(document.createElement('BR'));
	//---------------------------------------------------
	var joinButton = document.createElement('BUTTON');
	joinButton.innerHTML = 'Join';
	joinButton.id = 'joinButton';
	menuElement.appendChild(joinButton);

	var joinInput = document.createElement('INPUT');
	joinInput.id = 'joinInput';
	menuElement.appendChild(joinInput);

	menuElement.appendChild(document.createElement('BR'));
	//---------------------------------------------------
	var searchButton = document.createElement('BUTTON');
	searchButton.innerHTML = 'Find an opponent';
	searchButton.id = 'searchButton';
	menuElement.appendChild(searchButton);

	menuElement.appendChild(document.createElement('BR'));
	//---------------------------------------------------
	menuBlurbElement = document.createElement('SPAN');
	menuBlurbElement.innerHTML = menuBlurbText;
	menuBlurbElement.id = 'menuBlurb';
	menuElement.appendChild(menuBlurbElement);
	//---------------------------------------------------
	searchButton.addEventListener('click', () => {
		if(!searching){
			requestSearch();
			updateMenuBlurb('Searching for an opponent...');
			searchButton.innerHTML = 'Stop searching';
		}
		else{
			stopSearch();
			updateMenuBlurbForMS('Stopped searching for opponent.', 3000);
			searchButton.innerHTML = 'Find an opponent';
		}
	})

	joinButton.addEventListener('click', () => {
		if(connection == null && localClient != null){
			setConnection(localClient.connect(joinInput.value));
		}
	});
}

function startGame(){
	if(menuElement != null){
		document.body.removeChild(menuElement);
		menuElement = null;
		menuBlurb = null;
	}

	gameWorld = new GameWorld(1000, 700, 0.5);
	player1 = gameWorld.addPlayer((gameWorld.width / 8) - 32, 50, 'right', 'red');
	player2 = gameWorld.addPlayer(gameWorld.width - (gameWorld.width / 8), 50, 'left', 'blue');

	gameWorld.addRectangle(200, 16, (gameWorld.width/2) - 100, 500);
	gameWorld.addRectangle(200, 16, gameWorld.width - 200, 400);
	gameWorld.addRectangle(200, 16, 0, 400);

	menuBlurbText = '';
	gameWindow = gameWorld.canvas;
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

function updateSearchingPlayers(numOfSerachingPlayers){
	searchingPlayersElement.innerHTML = numOfSerachingPlayers.toString();
}

function updateMenuBlurb(newBlurb){
	if(menuBlurbElement != null){
		menuBlurbText = newBlurb;
		menuBlurbElement.innerHTML = menuBlurbText;
	}
}

function updateMenuBlurbForMS(newBlurb, blurbTime){
	if(menuBlurbElement != null){
		menuBlurbText = newBlurb;
		menuBlurbElement.innerHTML = menuBlurbText;
	}
	setTimeout(function() {
		if(menuBlurbText == newBlurb)
			updateMenuBlurb('');
	}, 3000);
}

function onLostConnection(){
	updateMenuBlurbForMS('Lost connection to opponent.', 3000);
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