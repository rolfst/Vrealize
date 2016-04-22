'use strict';

var mongoose = require('mongoose');
var config = require('../config');
var mongooseLogger = require('logger-facade-mongoose');

var dbConfig = config.get('database');
mongoose.set('debug', mongooseLogger);
mongoose.connect(dbConfig.uri);
mongoose.Promise = require('bluebird');

module.exports = mongoose;
