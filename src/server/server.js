var Path = require('path');

var app = require('express')()
.use(require('morgan')())
.use(require('st')({
    path: Path.join('src', 'client'),
    index: 'index.html'
}));

var server = require('http').createServer(app);

var io = require('socket.io').listen(server);

var minesweeper = require('./minesweeper.js')(io);

server.listen(2025);
