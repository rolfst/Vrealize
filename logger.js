'use strict';

var Logger = require('logger-facade-nodejs');
var LoggerConsolePlugin = require('logger-facade-console-plugin-nodejs');
var config = require('./config');

var plugin = new LoggerConsolePlugin(config.get('logging'));
Logger.use(plugin);

module.exports = Logger;
