var localClient;
var remoteClient;

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
		if(typeof remoteClient == 'undefined' && typeof localClient != undefined){
			setRemoteClient(localClient.connect($('#joinInput').val()));
			console.log('Connected to client');
			networkTick();
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
		remoteClient = conn;
		networkTick();
	});

	localClient.on('error', function(err){
		console.log("Local client error: " + err.type);
	});
}

// Put remote client bindings here
function setRemoteClient(newClient){
	remoteClient = newClient;
	remoteClient.on('error', function(err){
		console.log("Remote client error: " + err.type);
	});
}