$(document).ready(function() {
	var gameWorld = new GameWorld(500, 500);
	var player1 = gameWorld.addPlayer(0, 0);
	var player2 = gameWorld.addPlayer(0, 300);

	var gameCanvas = {
		canvas : document.createElement('canvas'),
		init : function() {
			this.canvas.width = gameWorld.width;
			this.canvas.height = gameWorld.height;
			this.context = this.canvas.getContext('2d');
			document.body.appendChild(this.canvas);
		},
		clear : function(){
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}
	gameCanvas.init();
});