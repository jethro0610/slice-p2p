var matchmakingServer = io();
var searching = false;

document.addEventListener('DOMContentLoaded', function() {
	document.addEventListener('start', () => onStart());
});

function requestSearch(){
	if(!searching){
		searching = true;
		matchmakingServer.emit('requestSearch');
	}
}

function stopSearch(){
	if(searching){
		searching = false;
		matchmakingServer.emit('stopSearch');
	}
}

matchmakingServer.on('sendClient', function(joinClientID){
	if(connection == null){
		setConnection(localClient.connect(joinClientID));
	}
})

matchmakingServer.on('sendClientID', function(newClientID){
	console.log('recieved client id: ' + newClientID.toString());
	console.log(document.URL);
	if(document.URL == 'http://localhost:3000/'){
		setLocalClient(new Peer(newClientID, {host: '/', port: 3000, path:'/api'}));
	}
	else{
		setLocalClient(new Peer(newClientID, {host: '/', path:'/api'}));
	}
});

function onStart(){
	searching = false;
	matchmakingServer.emit('foundMatch');
}