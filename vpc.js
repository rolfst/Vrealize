'use strict';

var ZSSService = require('zmq-service-suite-service');
var config = require('./config');
var service = require('./services/vpc');
var instance = new ZSSService(config.get('vpcService'));
var logger = require('./logger').Logger; //eslint-disable-line no-unused-vars

// service operation
instance.addVerb('list', service.list);
instance.addVerb('get', service.get);

instance.run();
