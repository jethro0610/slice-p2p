var thisClient;
var connectedClient;

class PeerMessage {
	constructor(messageName, messageData){
		this.messageName = messageName;
		this.messageData = messageData;
	}
}

$(document).ready(function() {
	setThisClient(new Peer());

	$('#joinButton').click(function (){
		if(typeof connectedClient == 'undefined' && typeof thisClient != undefined){
			setConnectedClient(thisClient.connect($('#joinInput').val()));
			networkTick();
		}
	});
});

// Put this client's bindings here
function setThisClient(newClient){
	thisClient = newClient;
	thisClient.on('open', function(id) {
		$('#hostCode').text(thisClient.id);
	});

	thisClient.on('connection', function(conn){
		console.log('got a connection');
		connectedClient = conn;
		networkTick();
	});
}

// Put the connected client's bindings here
function setConnectedClient(newClient){
	connectedClient = newClient;
}

function networkTick(){
	// Tick only if the client is set and is connected to another client
	if(typeof thisClient != 'undefined' && typeof connectedClient != 'undefined'){
		this.setTimeout(tick, 1000);
	}
}