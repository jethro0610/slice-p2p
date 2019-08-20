var matchmakingServer = io();
requestClientID();
var hostList = [];
requestHostList();

function requestClientID(){
	matchmakingServer.emit('requestClientID');
}

function requestHost(){
	matchmakingServer.emit('requestHost');
}

function requestHostList(){
	matchmakingServer.emit('requestHostList');
}

function joinRandom(){
	var randomInt = Math.floor(Math.random() * hostList.length);
	setConnection(localClient.connect(hostList[randomInt]));
}

matchmakingServer.on('sendClientID', function(newClientID){
	console.log('recieved client id: ' + newClientID.toString());
	setLocalClient(new Peer(newClientID, {host: 'localhost', port: 3000, path:'/api'}));
});

matchmakingServer.on('sendHostList', function(newHostList){
	hostList = newHostList;
	console.log(hostList);
});