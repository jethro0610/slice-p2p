var matchmakingServer = io();
var searching = false;
requestClientID();

$(document).ready(function() {
	$(document).on('start', onStart);
});

function requestClientID(){
	matchmakingServer.emit('requestClientID');
}

function requestSearch(){
	matchmakingServer.emit('requestSearch');
}

matchmakingServer.on('confirmSearch', function() {
	searching = true;
	matchmakingServer.emit('requestRandomClient');
});

matchmakingServer.on('sendRandomClient', function(joinClientID) {
	console.log('got random client');
	if(searching){
		if(joinClientID != null){
			setConnection(localClient.connect(joinClientID));
		}
		else{
			matchmakingServer.emit('requestRandomClient');
		}
	}
});

matchmakingServer.on('sendClientID', function(newClientID){
	console.log('recieved client id: ' + newClientID.toString());
	setLocalClient(new Peer(newClientID, {host: 'localhost', port: 3000, path:'/api'}));
});

function onStart(){
	matchmakingServer.emit('foundMatch');
}