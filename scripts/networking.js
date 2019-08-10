var localClient;
var connection;

var currentInput = new Inputs();

var localInputBuffer = [];
var remoteInputBuffer = [];

var numberOfSentInputs = 0;
var numberOfRecievedInputs = 0;

var bufferSize = 6;
var debugStopSending = false;

function Inputs() {
	this.up = false
	this.down = false;
	this.left = false;
	this.right = false;
}

addEventListener("keydown", function (e) {
	if(e.keyCode == 87)
		currentInput.up = true;
	if(e.keyCode == 83)
		currentInput.down = true;
	if(e.keyCode == 65)
		currentInput.left = true;
	if(e.keyCode == 68)
		currentInput.right = true;
}, false);

addEventListener("keyup", function (e) {
	if(e.keyCode == 87)
		currentInput.up = false;
	if(e.keyCode == 83)
		currentInput.down = false;
	if(e.keyCode == 65)
		currentInput.left = false;
	if(e.keyCode == 68)
		currentInput.right = false;
}, false);


class PeerMessage {
	constructor(messageName, messageData){
		this.messageName = messageName;
		this.messageData = messageData;
	}
}

$(document).ready(function() {
	setLocalClient(new Peer());

	$('#joinButton').click(function (){
		if(typeof connection == 'undefined' && typeof localClient != undefined){
			setConnection(localClient.connect($('#joinInput').val()));
			console.log('Connected to client');
		}
	});
});

// Put local client bindings here
function setLocalClient(newClient){
	localClient = newClient;
	localClient.on('open', function(id) {
		$('#hostCode').text(localClient.id);
	});

	localClient.on('connection', function(conn){
		console.log('Got a connection');
		setConnection(conn);
	});

	localClient.on('error', function(err){
		console.log("Local client error: " + err.type);
	});
}

// Put connection bindings here
function setConnection(newConnection){
	connection = newConnection;

	connection.on('open', function() {
		sendInput();
	});

	connection.on('error', function(err){
		console.log("Remote client error: " + err.type);
	});

	connection.on('data', function(data){
		onRecieveMessage(data);
	});
}

function sendMessage(peerMessage){
	connection.send(JSON.stringify(peerMessage));
}

function onRecieveMessage(peerMessageJSON) {
	var peerMessage;
	// Only continute if the message is a string
	if(typeof peerMessageJSON != 'string'){
		console.log('Recieved data is not a valid PeerMessage');
		return false;
	}
	// Only continue if the message is a json object
	try {
		peerMessage = JSON.parse(peerMessageJSON);
		if(typeof peerMessage.messageName == 'undefined'){
			console.log('Recieved data is not a valid PeerMessage');
			return;
		}
	} catch (err){
		console.log('Recieved data is not a valid PeerMessage');
		return false;
	}

	if(peerMessage.messageName == 'input'){
		onRecieveInput(peerMessage.messageData);
	}
}

function sendInput(){
	if(numberOfSentInputs <= numberOfRecievedInputs && debugStopSending == false){
		sendMessage(new PeerMessage('input', currentInput));
		numberOfSentInputs += 1;
	}
	setTimeout(sendInput, 1000);
}

function onRecieveInput(recievedInputs){
	numberOfRecievedInputs += 1;

	console.log("Inputs sent: " + numberOfSentInputs.toString() + " | Inputs recieved: " + numberOfRecievedInputs.toString());
}

function gameTick(){

	setTimeout
}