var matchmakingServer = io();

function requestClientID(){
	matchmakingServer.emit('requestClientID');
}

matchmakingServer.on('sendClientID', function(newClientID){
	console.log('recieved client id: ' + newClientID.toString());
	setLocalClient(new Peer(newClientID, {host: 'localhost', port: 3000, path:'/api'}));
});