'use strict';
var Token = require('../repositories/dao/token');
var moment = require('moment');
var _ = require('lodash');
var logger = require('../logger');
logger.getLogger('repohelper');

function getDummyToken() {
  return {
    username: 'username',
    token: 'aaaabbbcccc',
    expiry: moment().toDate()
  };
}

function getExpiredToken() {
  var expired = moment().subtract(1, 'hours').toDate();
  return {
    token: 'aabe0119ce33',
    username: 'expiredToken',
    expiry: expired
  };
}

function createOne(token, callback) {
  var data = token || getDummyToken();
  var cb = callback || _.noop;
  return new Token(data).save(cb);
}

var helper = {
  dummyToken: getDummyToken,
  expiredToken: getExpiredToken,
  createOne: createOne,
  findById: function (id, callback) {
    Token.findById(id, function (err, data) {
      return callback(err, data);
    }).lean();
  },
  findByUsername: function (name, callback) {
    Token.findOne({username: name}, function (err, data) {
      return callback(err, data);
    });
  }
};

module.exports = helper;
