'use strict';

/**
 * Manage the saved game settings, storing them to localStorage.
 */
function Settings(game){
    this.game = game;
    this.storage = {};
    if(this.storage.minesweeper){
        var _settings = JSON.parse(this.storage.minesweeper);
        this.width = _settings.width;
        this.height = _settings.height;
        this.mines = _settings.mines;
    } else {
        this.easy();
        this.save();
    }
    this.shown = false;
}

/**
 * Quick call for an easy "beginner" board.
 */
Settings.prototype.easy = function(){
    this.width = this.height = 8;
    this.mines = 10;
};

/**
 * Quick call for a medium "intermediate" board.
 */
Settings.prototype.medium = function(){
    this.width = this.height = 16;
    this.mines = 40;
};

/**
 * Quick call for an hard "expert" board.
 */
Settings.prototype.hard = function(){
    this.width = 30;
    this.height = 16;
    this.mines = 99;
};

/**
 * Store the current settings in localStorage.
 */
Settings.prototype.save = function(){
    this.storage.minesweeper = JSON.stringify({
        width: this.width,
        height: this.height,
        mines: this.mines
    });
};

/**
 * Apply the current settings to the game.
 */
Settings.prototype.apply = function(){
    this.shown = false;
    this.save();
    this.game.reload();
};

module.exports = Settings;
