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
		this.socket.emit('hi');

		this.assignSocketFunctions();
	}

	searchForClient(){
		
	}

	assignSocketFunctions(){
		this.socket.on('requestSearch', () => this.onRequestSearch());

		this.socket.on('requestRandomClient', () => this.onRequestRandomClient());

		this.socket.on('foundMatch', () => this.onFoundMatch());
	}

	onRequestSearch(){
		if(!searchingClients.includes(this)){
			searchingClients.push(this);
			this.socket.emit('confirmSearch');
		}
	}

	onRequestRandomClient(){
		if(!this.isPinging) {
			if(this.canPing){
				console.log('pinging');
				if(this.canPingTimer == null)
					this.canPingTimer = setTimeout(() => this.resetTimer(),1000);

				this.canPing = false;
				this.isPinging = true;
				for (var i = 0; i < searchingClients.length; i++) {
					if (searchingClients[i] != this && !searchingClients[i].isPinging){
						this.socket.emit('sendRandomClient', searchingClients[i].id);
						break;
					}
				}
			}
			this.socket.emit('sendRandomClient', null);
		}
		else{
			console.log('stop pinging');
			this.isPinging = false;
			this.socket.emit('sendRandomClient', null);
		}
	}

	onFoundMatch(){
		this.requestingClient.isPinging = false;
		this.requestingClient.canPing = true;
		this.requestingClient.canPingTimer = null;
		searchingClients.splice(searchingClients.indexOf(this), 1);
	}

	resetTimer() {
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