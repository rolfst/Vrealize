'use strict';
var Token = require('../repositories/dao/token');
var moment = require('moment');
var _ = require('lodash');
var logger = require('../logger').getLogger('repohelper');

function getDummyToken() {
  return {
    id: '56c2005b592b0067dcfb53f7',
    tenant: 'tenant',
    token: 'aaaabbbcccc',
    expiry: moment().toISOString()
  };
}


function getExpiredToken() {
  var expired = moment().subtract(1, 'hours').toISOString();
  return { id: '56c2005b592b0067dcfb53f5',
    token: 'aabe0119ce33',
    tenant: 'expiredTenantToken',
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
  dummyToken2: getExpiredToken,
  createOne: createOne,
  createSecond: function (callback) {
    return createOne(getExpiredToken(), callback);
  },
  findById: function (id, callback) {
    logger.debug(id);
    Token.findById(id, function (err, data) {
      return callback(err, data);
    }).lean();
  },
  findByTenant: function (name, callback) {
    Token.findOne({tenant: name}, function (err, data) {
      return callback(err, data);
    });
  },
  mapToken: function (token) {
    var mappedToken = token.toJSON();
    mappedToken.id = mappedToken._id;
    mappedToken.createdAt = moment(token.createdAt).toISOString();
    delete mappedToken._id;
    delete mappedToken.__v;
    return mappedToken;
  }
};

module.exports = helper;
