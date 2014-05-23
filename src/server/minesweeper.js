var Minefield = require('./minefield');
var Settings = require('./settings');

var minesweeper = function(io){
    var settings = new Settings();
    var game = new Minefield(settings);
    io.on('connection', function(socket){
        socket.emit('reset', game.serialize());
        socket.on('show', function(data){
            var spot = game.getSpot(data.row, data.col);
            spot.show();
        });
        game.on('reveal', function(spot){
            socket.emit('reveal', spot.toRevealed());
        });
    });

};

module.exports = minesweeper;
