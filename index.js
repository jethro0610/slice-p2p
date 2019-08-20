var express = require('express');
var uniqid = require('uniqid');

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var ExpressPeerServer = require('peer').ExpressPeerServer;

var hostingClients = [];
var connectedClients = [];

class networkClient {
	constructor(newClientSocket, newClientID) {
		this.socket = newClientSocket;
		this.id = newClientID;
	}
}

// Static files
app.use(express.static('public'));

// Listen on port 3000
server = http.listen(3000, function (){
	console.log('Listening');
});

var options = {
	debug: true
}

// Initialize ExpressPeerServer
var peerServer = ExpressPeerServer(server, options);
app.use('/api', peerServer);

// On client connection to SocketIO server
io.on('connection', function(socket){
	console.log('a client connected to socketIO');
	
	socket.on('requestClientID', function(){
		console.log('client id requested');
		// Only assign an ID if the client doesn't have one
		if(getClientFromSocket(socket, connectedClients) == null){
			var generatedID = uniqid.time();
			connectedClients.push(new networkClient(socket, generatedID));
			socket.emit('sendClientID', generatedID);
		}
	});

	socket.on('requestHost', function(){
		var requestingClient = getClientFromSocket(socket, connectedClients);
		if(requestingClient != null && getClientFromSocket(socket, hostingClients) == null)
			hostingClients.push(requestingClient);
	});

	socket.on('requestHostList', function(){
		var hostListToSend = [];
		for (var i = 0; i < hostingClients.length; i++) {
			hostListToSend.push(hostingClients[i].id);
		}
		socket.emit('sendHostList', hostListToSend);
	});
});

function getClientFromID(idToCheck, arrayToCheck){
	for (var i = 0; i < arrayToCheck.length; i++) {
		if(arrayToCheck[i].id == idToCheck)
			return arrayToCheck[i];
	}
	return null;
}

function getClientFromSocket(socketToCheck, arrayToCheck){
	for (var i = 0; i < arrayToCheck.length; i++) {
		if(arrayToCheck[i].socket == socketToCheck)
			return arrayToCheck[i];
	}
	return null;
}