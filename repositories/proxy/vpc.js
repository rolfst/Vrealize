'use strict';

var vpcConfig = require('../../config').get('vpcConfig');
var logger = require('../../logger');
logger = logger.getLogger('Proxy');
var request = require('request-promise');
var Token = require('../dao/token');
var moment = require('moment');
var _ = require('lodash');

var baseUrl = vpcConfig.baseUrl;
var loginPath = '/identity/api/tokens';

var logindefaults = {
  url: baseUrl + loginPath,
  body: {
    username: vpcConfig.username,
    password: vpcConfig.password,
    tenant: vpcConfig.tenant
  },
  headers: {
    'Content-Type': 'application/json'
  },
  json: true
};

function isBeforeExpiryCutoff(date) {
  var now = moment();
  return moment(date).isBefore(now.toISOString());
}

function verifyCredentials(credentials) {
  return Token.findOne({username: credentials.username}).then(function (token) {
    if (!token) {return [credentials, null];}
    if (isBeforeExpiryCutoff(token.expiry)) {
      return [credentials, token.token];
    }
    return [credentials, null];
  });
}

function login(options) {
  return verifyCredentials(options)
  .spread(function (credentials, token) {
    if (token) {return token;}

    var httpOptions = _.defaults({}, logindefaults, {method: 'POST'});
    httpOptions.body = credentials;
    return request(httpOptions).then(function (body) {
      var storableCredentials = _.pick(credentials, ['username', 'tenant']);
      var result = {
        token: body.id,
        expiry: body.expiry
      };
      var baseToken = _.merge(storableCredentials, result);
      return Token.update({username: credentials.username}, baseToken, {upsert: true})
      .then(function () {
        return body.id;
      });
    });
  })
  .catch(function (reason) {
    var error = {
      userMessage: 'Unexpected response.',
      code: reason.statusCode,
      developerMessage: 'Unexpected response from vpc: ' + reason.error.message
    };
    throw error;
  });
}

function fetchResource(token, resourceId) {
  return resourceId;
}

function fetchAllinstances(token, options) {
  return [token, options];
}

function getComputeInstance(options, resourceId) {

  return login(options).then(function (token) {

    fetchResource(token, resourceId);
  });
}

function getComputeInstanceList(options) {
  verifyCredentials(options).spread(login);

  return login(options).then(function (token) {
    return fetchAllinstances(token, options);
  });
}

module.exports = {
  login: login,
  getComputeInstance: getComputeInstance,
  getComputeInstanceList: getComputeInstanceList
};

