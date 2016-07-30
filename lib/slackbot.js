'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var SlackBot = function Constructor(settings) {
  this.settings = settings;
  this.settings.name = this.settings.name || 'slackbot';
  this.dbPath = settings.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'slackbot.db');

  this.user = null;
  this.db = null;
};

util.inherits(SlackBot, Bot);

SlackBot.prototype._onStart = function () {
  this._loadBotUser();
  this._connectDb();
  this._firstRunCheck();
};

module.exports = SlackBot;
