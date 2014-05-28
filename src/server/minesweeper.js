var Minefield = require('./minefield');
var Settings = require('./settings');

var minesweeper = function(io){
    var settings = new Settings();
    var game = new Minefield(settings);

    io.on('connection', function(socket){
        socket.emit('reset', game.serialize());
        socket.on('reset', function(){
            game.reset();
        });
        socket.on('show', function(data){
            var spot = game.getSpot(data.row, data.col);
            spot.show();
        });
        socket.on('flag', function(data){
            var spot = game.getSpot(data.row, data.col);
            spot.flag();
        });

        game.on('reset', function(){
            socket.emit('reset', game.serialize());
        });
        game.on('reveal', function(spot){
            socket.emit('reveal', spot.toRevealed());
        });
        game.on('flagged', function(spot){
            socket.emit('flagged', spot.toFlagged());
        });
    });

};

module.exports = minesweeper;
