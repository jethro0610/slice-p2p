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

		this.isPinging = false
		this.sendClientTimer = null;

		this.assignSocketFunctions();
	}

	searchForClient(){
		
	}

	assignSocketFunctions(){
		this.socket.on('requestSearch', () => this.onRequestSearch());
		this.socket.on('stopSearch', () => this.onStopSearch());
		this.socket.on('denyClient', () => this.onDenyClient());
		this.socket.on('foundMatch', () => this.onFoundMatch());
		this.socket.on('disconnect', () => this.onDisconnect());
	}

	onRequestSearch(){
		if(!searchingClients.includes(this)){
			searchingClients.push(this);
			io.emit('sendSearchingPlayers', searchingClients.length);
			this.sendClientTimer = setTimeout(() => this.sendClient(), 1000);
		}
	}

	onStopSearch(){
		if(searchingClients.includes(this))
			searchingClients.splice(searchingClients.indexOf(this), 1);
	}

	sendClient(){
		if(this.isSearching()){
			var arrayWithoutClient = searchingClients.slice();
			arrayWithoutClient.splice(arrayWithoutClient.indexOf(this), 1);
			this.sendClientTimer = null;
			if(arrayWithoutClient.length > 0){
				var sendClientIndex = getRandomInt(0, arrayWithoutClient.length - 1);
				if (arrayWithoutClient[sendClientIndex] != this && !arrayWithoutClient[sendClientIndex].isPinging){
					this.socket.emit('sendClient', arrayWithoutClient[sendClientIndex].id);
					this.isPinging = true;
				}
				else{
					this.sendClientTimer = setTimeout(() => this.sendClient(), 1000);
				}
			}
			else {
				this.sendClientTimer = setTimeout(() => this.sendClient(), 1000);
			}
		}
	}

	onDenyClient(){
		if(this.isSearching() && this.isPinging){
			this.isPinging = false;
			if(this.sendClientTimer == null)
				this.sendClientTimer = setTimeout(() => this.sendClient(), 1000);
		}
	}

	onFoundMatch(){
		this.isPinging = false;
		searchingClients.splice(searchingClients.indexOf(this), 1);
		io.emit('sendSearchingPlayers', searchingClients.length);
	}

	onDisconnect(){
		// Remove from connected clients list
		if(connectedClients.includes(this)){
			connectedClients.splice(connectedClients.indexOf(this), 1);
		}

		if(this.isSearching()){
			searchingClients.splice(searchingClients.indexOf(this), 1);
			io.emit('sendSearchingPlayers', searchingClients.length);
		}
	}

	isSearching(){
		if(searchingClients.includes(this)){
			return true;
		}
		else{
			return false;
		}
	}
}

// Static files
app.use(express.static('public'));

// Listen on port 3000
server = http.listen(3000, function (){
	console.log('Listening');
});

// Initialize ExpressPeerServer
var peerServer = ExpressPeerServer(server);
app.use('/api', peerServer);

// On client connection to SocketIO server
io.on('connection', function(socket){
	// Only assign an ID if the client doesn't have one
	if(getClientFromSocket(socket, connectedClients) == null){
		var generatedID = uniqid.time();
		connectedClients.push(new networkClient(socket, generatedID));
		socket.emit('sendClientID', generatedID);
	}
	socket.emit('sendSearchingPlayers', searchingClients.length);
});

peerServer.on('disconnect', (client) =>{
	// Remove from connected clients list
	var disconnectingPeer = getClientFromID(client.toString(), connectedClients);
	if(disconnectingPeer != null){
		var generatedID = uniqid.time();
		disconnectingPeer.id = generatedID;
		disconnectingPeer.socket.emit('sendClientID', generatedID);
	}
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

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}