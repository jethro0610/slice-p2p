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
		this.socket.on('denyClient', () => this.onDenyClient());
		this.socket.on('foundMatch', () => this.onFoundMatch());
	}

	onRequestSearch(){
		if(!searchingClients.includes(this)){
			searchingClients.push(this);
			this.sendClientTimer = setTimeout(() => this.sendClient(), 1000);
		}
	}

	sendClient(){
		if(this.isSearching()){
			for (var i = 0; i < searchingClients.length; i++) {
				if (searchingClients[i] != this && !searchingClients[i].isPinging){
					this.socket.emit('sendClient', searchingClients[i].id);
					this.isPinging = true;
					break;
				}
			}
			this.sendClientTimer = null;
			if(searchingClients.length <= 1)
				this.sendClientTimer = setTimeout(() => this.sendClient(), 1000);
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
		console.log('found match');
		this.isPinging = false;
		searchingClients.splice(searchingClients.indexOf(this), 1);
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