var util = require('util');
var events = require('events');
var Spot = require('./spot')

/**
 * A constructor to manage a minefield. Takes a size (square, for now...)
 * and difficulty. Defaults to 8 x 8 with 10 mines.
 */
function Minefield(settings){
    this.settings = settings;
    this._init();
    this.is = {
        started: false,
        over: false
    }
}
util.inherits(Minefield, events.EventEmitter);

/**
 * Start this game going after the first click.
 */
Minefield.prototype.start = function(position){
    if(this.is.started){ return; }
    this.reset();
    this.is.started = true;
    this.addMines(this.difficulty, position);
    // this.game.start();
};

/**
 * Build a new field. This is to help the VM figure out our memory - we
 * statically declare our arrays, and the Spot class doesn't change from under
 * them, letting the VM's virtual classes shine.
 */
Minefield.prototype._init = function(){
    var i, j;
    this.mines = [];
    this.flags = [];
    this.rows = new Array(this.settings.height);
    for(i = 0 ; i < this.settings.height ; i++){
        this.rows[i] = {
            spots: new Array(this.settings.width)
        };
        for(j = 0; j < this.settings.width ; j++){
            this.rows[i].spots[j] = new Spot(this, i, j);
        }
    };

    return this;
}

/**
 * Reset the field, removing all mines and reseting any counters.
 */
Minefield.prototype.reset = function(){
    var i, j;
    this.is = {
        started: false,
        over: false
    };
    this.mines.length = 0;
    this.flags.length = 0;
    this.squaresLeft = this.settings.height * this.settings.width;
    for(i = 0 ; i < this.settings.height ; i++){
        for(j = 0; j < this.settings.width ; j++){
            this.rows[i].spots[j].reset();
        }
    }
    this.emit('reset');
    return this;
}

/**
 * Add a few more mines! Uses bogosearch to not add too few. Position is a
 * {row, col} that should also not be used.
 *
 * This approach is probably not a good idea when the ratio of mines to squares
 * gets above 25%.
 */
Minefield.prototype.addMines = function(count, position){
    if(arguments.length < 2){
        position = count; count = null;
    }
    var i, j, spot, rnd = function(q){
        return Math.floor(Math.random() * q);
    }
    // Bogosearch!
    var added = 0;
    count = count || this.settings.mines;
    position = position || {row: -1, col: -1};
    while(added < count){
        do {
            // Find a spot that isn't reseaved.
            i = rnd(this.settings.height);
            j = rnd(this.settings.width);
        } while(i == position.row || j == position.col);
        if(!(spot = this.getSpot(i, j)).is.mine){
            // Don't double-check already placed mines.
            spot.is.mine = true;
            this.mines.push(spot);
            added += 1;
        }
    }
    this.squaresLeft -= count;

    return this;
};

/**
 * Someone just stepped on a mine...
 */
Minefield.prototype.boom = function(){
    this.mines.forEach(function(spot){
        spot.show();
    });
    // this.game.stop();
    this.is.over = true;
    this.emit('Boom!');
};

/**
 * Unflagging a discovered square.
 */
Minefield.prototype.unprogress = function(){
    this.squaresLeft++;
};

/**
 * Mark progress in uncovering squares!
 */
Minefield.prototype.progress = function(spot){
    if(--this.squaresLeft === 0){
        this.winner();
    }
    this.emit('reveal', spot);
};

Minefield.prototype.flag = function(spot){
    this.emit('flagged', spot);
}

/**
 * Declare this as a winning state!
 */
Minefield.prototype.winner = function(){
    this.game.stop();
    this.is.over = true;
    this.mines.forEach(function(spot){
        if(!spot.is.flagged){
            spot.flag();
        }
    });
};

/**
 * Quick count of the number of remaining mines.
 */
Minefield.prototype.minesRemaining = function(){
    return this.game.settings.mines - this.flags.length;
};

/**
 * Return a spot given a row and col, or null if out of bounds.
 */
Minefield.prototype.getSpot = function(row, col){
    return (this.rows[row] || {spots: []}).spots[col];
};

Minefield.prototype.serialize = function(){
    var field = {
        size: {
            height: this.settings.height,
            width: this.settings.width
        },
        revealed: this.rows.reduce(function(revealed, row){
            return revealed.concat(row.spots.reduce(function(revealed, spot){
                if(spot.is.revealed){
                    revealed.push(spot.toRevealed());
                }
                return revealed;
            }.bind(this), []));
        }.bind(this), []),
        flagged: this.flags.map(function(spot){
            return spot.toFlagged();
        })
    };
    return field;
}

module.exports = Minefield;
