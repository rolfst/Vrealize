'use strict';

var mongoose = require('mongoose');
var config = require('../config');

var dbConfig = config.get('database');
mongoose.set('debug', dbConfig.log);
mongoose.connect(dbConfig.uri);
mongoose.Promise = require('bluebird');

module.exports = mongoose;
