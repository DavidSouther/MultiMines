var util = require('util');
var events = require('events');

/**
 * A class to manage a spot. It handles showing and flagging itself, and
 * telling its neighbors to show themselves when there's no neighboring mines.
 */
function Spot(field, row, col){
    this.field = field;
    this.position = {
        row: row,
        col: col
    };
    this.reset();
}

util.inherits(Spot, events.EventEmitter);

/**
 * Reset this square, moving to the correct flag state, and putting boolean
 * flags back to initial values.
 */
Spot.prototype.reset = function(){
    // The state is the srting key, not the object value.
    this.state = Spot.FlagStates.QUESTION.next
    this.is = {
        flagged: false,
        revealed: false,
        mine: false
    }
}

/**
 * A little state machine. The transition functions are INCOMING operations.
 */
Spot.FlagStates = {
    "NORMAL": {
        next: "MARKED",
        transition: function(){
            var q;
            this.is.flagged = false;
            this.field.flags.splice(
                q = this.field.flags.indexOf(this), 1,
                this.field.flags.slice(q + 1)
            )
        }
    },
    "MARKED": {
        next: "QUESTION",
        transition: function(){
            this.field.flags.push(this);
            this.is.flagged = true;
        }
    },
    "QUESTION": {
        next: "NORMAL",
        transition: function(){
            // A question doesn't count as progress.
            this.field.unprogress();
        }
    }
}

/**
 * Flagging a spot goes through three states - normal, marked, question.
 */
Spot.prototype.flag = function(){
    if (this.is.revealed) { return; }
    this.state = Spot.FlagStates[this.state].next;
    Spot.FlagStates[this.state].transition.call(this);
    this.field.flag(this);
}

/**
 * Reveal this spot... with possibly dangerous consequences!
 */
Spot.prototype.show = function(){
    // Don't do anything if we don't need to.
    if( this.is.revealed || this.is.flagged || this.field.is.over) { return; }
    // If the game hasn't started yet, add some mines (but not at this spot).
    if(!this.field.is.started){ this.field.start(this.position); }
    this.is.revealed = true;
    if(this.is.mine){
        // Do LOST things
        this.field.boom();
    } else {
        if(this.neighbors() == 0){
            // Empty squares recursively reveal all their neighbors.
            this._showNeighbors();
        }
        this.field.progress(this);
    }
    return this;
}

/**
 * Go around and tell all your non-mine neighbors to show themselves. If unsafe
 * is true, this also tells unflagged mine neighbors to show themselves... for
 * a boom.
 */
Spot.prototype._showNeighbors = function(unsafe){
    var self = this, sn = function(i, j){
        var n;
        if(n = self.field.getSpot(i, j)){
            if(unsafe || !n.is.mine){
                n.show();
            }
        }
    };
    this.neighborhood(sn);
}

/**
 * When clicking on an uncovered square, if as many neighbors have been flagged
 * as there are neighbors with mines, show all the neighbors UNSAFELY.
 */
Spot.prototype.chord = function(){
    if(this.neighbors() == this.flaggedNeighbors()){
        this._showNeighbors(true);
    }
}

/**
 * A helper funtion, to apply a count reduction on the 8 neighbors of this spot.
 */
Spot.prototype.neighborhood = function(map){
    var cn = map;
    var i = this.position.row, j = this.position.col;
    return 0 +
        cn(i-1, j-1) + cn(i-1, j) + cn(i-1, j+1)
        + cn(i, j-1) + cn(i, j+1) +
        cn(i+1, j-1) + cn(i+1, j) + cn(i+1, j+1)
        ;
}

/**
 * Get a count of neighbors... NIMBY Mine neighbors!
 */
Spot.prototype.neighbors = function(){
    // Utility to count a neighbor safely (eg edge of the board).
    var self = this, cn = function(i, j){
        return (
            self.field.getSpot(i, j) || {is: {mine: false}}
        ).is.mine ? 1 : 0
    };

    return this.neighborhood(cn);
}

/**
 * Get a count of the number of neighbors that are flagged.
 */
Spot.prototype.flaggedNeighbors = function(){
    var self = this, cn = function(i, j){
        return (
            self.field.getSpot(i, j) || {is: {flagged: false}}
        ).is.flagged ? 1 : 0
    }
    return this.neighborhood(cn);
}

Spot.prototype.serialize = function(){
    return [this.is.flagged, this.is.mine];
};

Spot.prototype.toRevealed = function(){
    return [
        this.position.row,
        this.position.col,
        this.neighbors()
    ];
};

Spot.prototype.toFlagged = function(){
    return [
        this.position.row,
        this.position.col,
        this.state
    ];
};

module.exports = Spot;
