var localClient;
var connection;

var currentInputs;

function Inputs() {
	this.up = false
	this.down = false;
	this.left = false;
	this.right = false;
}

addEventListener("keydown", function (e) {
	if(e.keyCode == 87)
		currentInputs.up = true;
	if(e.keyCode == 83)
		currentInputs.down = true;
	if(e.keyCode == 65)
		currentInputs.left = true;
	if(e.keyCode == 68)
		currentInputs.right = true;
}, false);

addEventListener("keyup", function (e) {
	if(e.keyCode == 87)
		currentInputs.up = false;
	if(e.keyCode == 83)
		currentInputs.down = false;
	if(e.keyCode == 65)
		localClientInputs.left = false;
	if(e.keyCode == 68)
		currentInputs.right = false;
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
			sendMessage(new PeerMessage('testMessage', ''));
	});

	connection.on('error', function(err){
		console.log("Remote client error: " + err.type);
	});

	connection.on('data', function(data){
		recieveMessage(data);
	});
}

function sendMessage(peerMessage){
	connection.send(JSON.stringify(peerMessage));
}

function recieveMessage(peerMessageJSON) {
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
}