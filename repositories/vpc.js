'use strict';

var model = require('../models/subscription');
var Promise = require('bluebird');

function toModel(vpc) {
  vpc.id = vpc._id;
  return model(vpc);
}

function list(filter, pagination, callback) {

}


var repo = {
  list: list
};

module.exports = Promise.promisifyAll(repo);
