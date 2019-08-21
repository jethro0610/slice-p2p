var isTicking = false;

var localClient = null;
var connection = null;

var currentInput = new Inputs();

var lastLocalInput = null;
var lastRemoteInput = null;

var localInputBuffer = [];
var remoteInputBuffer = [];

var numberOfSentInputs = 0;
var numberOfRecievedInputs = 0;

var bufferSize = 1;
var canTick = false;

var startTickEvent = new Event('start-tick');
var tickEvent = new Event('net-tick');
var endTickEvent = new Event('end-tick');
var startEvent = new Event('start');

var lostConnectionEvent = new Event('lostConnection');
var resetEvent = new Event('reset');

var updateHostCodeEvent = new Event('updateHostCode');

var isHost = false;

var timeoutTimer;
var maxTimeout = 120 * 5;

function Inputs() {
	this.up = false
	this.down = false;
	this.left = false;
	this.right = false;
	this.dash = false;

	this.copyFromAnotherInput = function(inputToCopy){
		this.up = inputToCopy.up;
		this.down = inputToCopy.down;
		this.left = inputToCopy.left;
		this.right = inputToCopy.right;
		this.dash = inputToCopy.dash;
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
	if(e.keyCode == 16)
		currentInput.dash = true;
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
	if(e.keyCode == 16)
		currentInput.dash = false;
}, false);


class PeerMessage {
	constructor(messageName, messageData){
		this.messageName = messageName;
		this.messageData = messageData;
	}
}

// Put local client bindings here
function setLocalClient(newClient){
	localClient = newClient;
	localClient.on('open', function(id) {
		updateHostCodeEvent.newHostCode = id;
		document.dispatchEvent(updateHostCodeEvent);
	});

	localClient.on('connection', function(conn){
		console.log('Got a connection');
		setConnection(conn);
		isHost = true;
	});

	localClient.on('error', function(err){
		console.log("Local client error: " + err.type);
		if(err.type != 'network')
			reset();
	});
}

// Put connection bindings here
function setConnection(newConnection){
	if(connection == null){
		connection = newConnection;

		connection.on('open', function() {
			start();
		});

		connection.on('error', function(err){
			console.log("Remote client error: " + err.type);
			if(err.type != 'network')
				reset();
		});

		connection.on('close', function(){
			if(isTicking)
				executeLostConnection();
			
			console.log('connection closed');
			reset();
		});

		connection.on('data', function(data){
			// Reset the timeout timer when recieving data
			timeoutTimer = 0;

			onRecieveMessage(data);
		});
	}
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
	if(!isTicking)
		return;

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
	setTimeout(sendInput, 1000/120);
}

function onRecieveInput(recievedInput){
	remoteInputBuffer.push(recievedInput)
	numberOfRecievedInputs += 1;
}

function start(){
	isTicking = true;
	sendInput();
	document.dispatchEvent(startEvent);
	netTick();
}

function netTick(){
	if(!isTicking)
		return;

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
		document.dispatchEvent(startTickEvent);
		for (var i = 0; i < lowestBuffer; i++) {
			tickEvent.hasInput = true;
			lastLocalInput = localInputBuffer.shift();
			lastRemoteInput = remoteInputBuffer.shift();

			tickEvent.localInputThisTick = lastLocalInput;
			tickEvent.remoteInputThisTick = lastRemoteInput;

			document.dispatchEvent(tickEvent);
		}
		document.dispatchEvent(endTickEvent);
	}
	
	timeoutTimer += 1;
	// Reset if the timeout timer exceeds the alotted time
	if(timeoutTimer > maxTimeout){
		executeLostConnection();
		reset();
		return;
	}
	setTimeout(netTick, 1000/120);
}

function executeLostConnection(){
	document.dispatchEvent(lostConnectionEvent);
	reset();
}

function reset() {
	if (!isTicking)
		return;

	isTicking = false;

	connection.close();
	connection = null;

	currentInput = new Inputs();

	lastLocalInput = null;
	lastRemoteInput = null;

	localInputBuffer = [];
	remoteInputBuffer = [];

	numberOfSentInputs = 0;
	numberOfRecievedInputs = 0;

	bufferSize = 1;
	canTick = false;

	timeoutTimer = 0;

	isHost = false;
	document.dispatchEvent(resetEvent);
}