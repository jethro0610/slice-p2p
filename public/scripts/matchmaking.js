var matchmakingServer = io();
var searching = false;

$(document).ready(function() {
	$(document).on('start', onStart);
});

function requestSearch(){
	matchmakingServer.emit('requestSearch');
}

matchmakingServer.on('sendClient', function(joinClientID){
	if(typeof connection == 'undefined'){
		setConnection(localClient.connect(joinClientID));
	}
})

matchmakingServer.on('sendClientID', function(newClientID){
	console.log('recieved client id: ' + newClientID.toString());
	setLocalClient(new Peer(newClientID, {host: 'localhost', port: 3000, path:'/api'}));
});

function onStart(){
	matchmakingServer.emit('foundMatch');
}