var localClient;
var connection;

var currentInput = new Inputs();

let localInputBuffer = [];
let remoteInputBuffer = [];

var numberOfSentInputs = 0;
var numberOfRecievedInputs = 0;

var bufferSize = 1;
var canTick = false;

let startTickEvent = new $.Event('start-tick');
let tickEvent = new $.Event('net-tick');
let endTickEvent = new $.Event('end-tick');
let startEvent = new $.Event('start');

var isHost = false;

function Inputs() {
	this.up = false
	this.down = false;
	this.left = false;
	this.right = false;

	this.copyFromAnotherInput = function(inputToCopy){
		this.up = inputToCopy.up;
		this.down = inputToCopy.down;
		this.left = inputToCopy.left;
		this.right = inputToCopy.right;
	}
}

addEventListener("keydown", function (e) {
	if(e.keyCode == 32)
		currentInput.up = true;
	if(e.keyCode == 83)
		currentInput.down = true;
	if(e.keyCode == 65)
		currentInput.left = true;
	if(e.keyCode == 68)
		currentInput.right = true;
}, false);

addEventListener("keyup", function (e) {
	if(e.keyCode == 32)
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
		isHost = true;
	});

	localClient.on('error', function(err){
		console.log("Local client error: " + err.type);
	});
}

// Put connection bindings here
function setConnection(newConnection){
	connection = newConnection;

	connection.on('open', function() {
		start();
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
	// Send two inputs if the client is behind
	var timesToSend = 1;
	if(localInputBuffer.length < remoteInputBuffer.length - 1)
		timesToSend = 2;

	for (var i = 0; i < timesToSend; i++) {
		// Have to make a copy, otherwise whole array will be of a single reference
		var inputToSend = new Inputs();
		inputToSend.copyFromAnotherInput(currentInput);

		sendMessage(new PeerMessage('input', inputToSend));
		localInputBuffer.push(inputToSend);
		numberOfSentInputs += 1;
	}
	setTimeout(sendInput, 1000/60);
}

function onRecieveInput(recievedInput){
	remoteInputBuffer.push(recievedInput)
	numberOfRecievedInputs += 1;
	//console.log("Inputs sent: " + numberOfSentInputs.toString() + " | Inputs recieved: " + numberOfRecievedInputs.toString());
}

function start(){
	sendInput();
	$(document).trigger(startEvent);
	netTick();
}

var lastLocalInput;
var lastRemoteInput;

function netTick(){
	var lowestBuffer = 0;
	if(localInputBuffer.length < remoteInputBuffer.length){
		lowestBuffer = localInputBuffer.length;
	}
	if(localInputBuffer.length > remoteInputBuffer.length){
		lowestBuffer = remoteInputBuffer.length;
	}
	else if(localInputBuffer.length == remoteInputBuffer.length){
		lowestBuffer = remoteInputBuffer.length;
	}

	if(lowestBuffer > 0){
		$(document).trigger(startTickEvent);
		for (var i = 0; i < lowestBuffer; i++) {
			tickEvent.hasInput = true;
			lastLocalInput = localInputBuffer.shift();
			lastRemoteInput = remoteInputBuffer.shift();

			tickEvent.localInputThisTick = lastLocalInput;
			tickEvent.remoteInputThisTick = lastRemoteInput;

			$(document).trigger(tickEvent);
		}
		$(document).trigger(endTickEvent);
	}
	
	setTimeout(netTick, 1000/60);
}