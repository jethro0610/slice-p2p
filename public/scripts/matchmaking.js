var matchmakingServer = io();

function requestClientID(){
	matchmakingServer.emit('requestClientID');
}

matchmakingServer.on('sendClientID', function(){
	console.log('recieved client id');
});