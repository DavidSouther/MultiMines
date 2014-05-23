'use strict';

function Spot(socket, i, j){
    this.socket = socket;
    this.position = {
        row: i,
        col: j
    }
    this.is = {
        flagged: false,
        revealed: false
    };
}

Spot.prototype.show = function(){
    this.socket.emit('show', this.position);
}

function MinesweeperCtrl($scope){
    var self = this;
    this.field = {};
    this.socket = io.connect('http://localhost:2025');
    var _on = this.socket.on;
    this.socket.$on = function(event, fn){
        self.socket.on(event, function(data){
            $scope.$apply(function(){
                fn(data)
            });
        })
    };
    this.socket.$on('reset', function (data) {
        self.unserialize(data);
    });

    this.socket.$on('reveal', function(data){
        var spot = self.getSpot(data[0], data[1]);
        spot.is.revealed = true;
        spot.neighbors = data[2];
    });
}

MinesweeperCtrl.prototype.getSpot = function(row, col){
    return (this.field.rows[row] || {spots: []}).spots[col];
};

MinesweeperCtrl.prototype.unserialize = function(data){
    var i, j, spot;
    var height = data.size.height;
    var width = data.size.width;
    this.field.rows = new Array(height);
    for(i = 0; i < height; i++){
        this.field.rows[i] = {spots: new Array(width)};
        for(j = 0; j < width; j++){
            this.field.rows[i].spots[j] = new Spot(this.socket, i, j);
        }
    }
    if(data.flags){
        data.flags.forEach(function(spot){
            this.getSpot(spot[0][1]).is.flagged = true;
        });
    }
    if(data.revealed){
        data.revealed.forEach(function(spot){
            this.getSpot(spot[0], spot[1]).is.revealed = true;
            this.getSpot(spot[0], spot[1]).neighbors = spot[2];
        }.bind(this));
    }
};

angular.module('minesweeper', [])
.controller('MinesweeperCtrl', MinesweeperCtrl)
/**
 * Directive to $eval an expression when the user right-clicks an element.
 */
.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
})
/**
 * A helper to only run code on shift-click.
 * TODO Fix the continued propagation bug.
 */
.directive('ngShiftClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngShiftClick);
        element.bind('click', function(mouseEvent) {
            if(mouseEvent.shiftKey){
                scope.$apply(function() {
                    event.preventDefault();
                    fn(scope, {$event:event});
                });
            }
        });
    };
})
/**
 * A Helper directive to prevent accidentally dragging and selecting on the
 * minesweeper board.
 */
.directive('noSelect', function(){
    return function(scop, element){
        element.bind('selectstart', function(event){
            event.preventDefault();
            return false;
        });
    };
})
/**
 * A Filter to cleanly go from millis to display seconds.
 */
.filter('seconds', function(){
    return function(millis){
        return Math.floor(millis / 1000);
    }
});