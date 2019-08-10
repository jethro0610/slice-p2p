var localClient;
var remoteClient;

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

var currentTick = 0;
function networkTick(){
	currentTick += 1;
	console.log(currentTick);

	// Tick again only if the client is set and is connected to another client
	if(typeof localClient != 'undefined' && typeof remoteClient != 'undefined'){
		this.setTimeout(networkTick, 1000);
	}
}