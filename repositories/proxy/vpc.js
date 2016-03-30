'use strict';

var vpcConfig = require('../../config').get('vpcConfig');
var logger = require('../../logger');
logger = logger.getLogger('Proxy');
var request = require('request-promise');
var Promise = require('bluebird');
var Token = require('../dao/token');
var moment = require('moment');

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
var LOGIN_SAFETY_MARGIN_TIMEOUT = vpcConfig.safetyMargin
  || 1000; //eslint-disable-line no-magic-numbers


function isBeforeExpiryCutoff(date) {
  var now = moment().subtract(1, 'sec');
  return moment(date).isBefore(now.toISOString());
}

function verifyCredentials(options) {
  return Token.findOne({username: options.username}).then(function (token) {
    if (!token) {return [options, false];}
    if (isBeforeExpiryCutoff(token.expiry)) {
      return Promise.delay(LOGIN_SAFETY_MARGIN_TIMEOUT, [options, false]);
    }
    return [options, token.token];
  });

}

function login(options, token) {
  if (token) {return Promise.resolve(token);}

  var httpOptions = Object.assign(logindefaults, {method: 'POST'});
  httpOptions.body = options;

  return request(httpOptions).then(function (body) {
    return body.id;
  }).catch(function (reason) {
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
  loginPath: loginPath,
  login: login,
  getComputeInstance: getComputeInstance,
  getComputeInstanceList: getComputeInstanceList,
  verifyCredentials: verifyCredentials
};

