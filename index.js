var express = require('express');
var uniqid = require('uniqid');

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var ExpressPeerServer = require('peer').ExpressPeerServer;

var searchingClients = [];
var connectedClients = [];

class networkClient {
	constructor(newClientSocket, newClientID) {
		this.socket = newClientSocket;
		this.id = newClientID;
		this.isPinging = false;
		this.canPing = true;
		this.canPingTimer = null;
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

	socket.on('requestSearch', function(){
		var requestingClient = getClientFromSocket(socket, connectedClients);
		if(requestingClient != null && getClientFromSocket(socket, searchingClients) == null){
			searchingClients.push(requestingClient);
			socket.emit('confirmSearch');
		}
	});

	socket.on('requestRandomClient', function() {
		var requestingClient = getClientFromSocket(socket, searchingClients);
		if(requestingClient != null){

			if(!requestingClient.isPinging) {
				if(requestingClient.canPing){
					console.log('pinging');
					if(requestingClient.canPingTimer == null){
						requestingClient.canPingTimer = setTimeout(function(){
						 	requestingClient.canPing = true;
						 	requestingClient.canPingTimer = null;
						},1000*10);
					}

					requestingClient.canPing = false;
					requestingClient.isPinging = true;
					for (var i = 0; i < searchingClients.length; i++) {
						if (searchingClients[i] != requestingClient && !searchingClients[i].isPinging){
							socket.emit('sendRandomClient', searchingClients[i].id);
							break;
						}
					}
				}
				socket.emit('sendRandomClient', null);
			}
			else{
				console.log('stop pinging')
				requestingClient.isPinging = false;
				socket.emit('sendRandomClient', null);
			}
		}
	});

	socket.on('foundMatch', function(){
		var requestingClient = getClientFromSocket(socket, searchingClients);
		if(requestingClient != null){
			requestingClient.isPinging = false;
			requestingClient.canPing = true;
			requestingClient.canPingTimer = null;
			searchingClients.splice(searchingClients.indexOf(requestingClient), 1);
		}
	})
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