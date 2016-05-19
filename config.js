'use strict';

var convict = require('convict');
var schema = require('./configs/schema');

// Define a schema
var conf = convict(schema);

// Load environment dependent configuration
var env = conf.get('env');
conf.loadFile('./configs/' + env + '.json');

// Perform validation
conf.validate({strict: true});

module.exports = conf;
