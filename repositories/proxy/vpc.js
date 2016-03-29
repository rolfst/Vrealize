'use strict';

var request = require('request');
var Promise = require('bluebird');
var Token = require('../dao/token');
var _ = require('lodash');
var vpcConfig = require('../../config').get('vpcService');
var moment = require('moment');

var baseUrl = vpcConfig.baseUrl;

var logindefaults = {
  url: baseUrl + '/identity/api/tokens',
  json: {
    username: vpcConfig.username,
    password: vpcConfig.password,
    tenant: vpcConfig.tenant
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

var LOGIN_SAFETY_MARGIN_TIMEOUT = 1000;


function isBeforeExpiryCutoff(date) {
  var now = moment().subtract(1, 'sec');
  return moment(date).isBefore(now.toISOString());
}

function verifyCredentials(options) {
  return Promise.resolve(Token.findOne({tenant: options.tenant}).then(function (token) {
    if (!token) {return Promise.resolve([options, false]);}
    if (isBeforeExpiryCutoff(token.expiry)) {
      return Promise.delay(LOGIN_SAFETY_MARGIN_TIMEOUT, [options, false]);
    }
    return Promise.resolve([options, token.token]);
  }));

}

function login(options, token) {
  if (token) {return token;}
  var httpOptions = _.merge(logindefaults, options);

  return new Promise(function (resolve, reject) {
    request.post(httpOptions, function responseLoginHandler(err, res, body) {
      if (err) { return reject(err);}
      if (res.statusCode >= '400') {
        var errorMess = _.first(body.errors).systemMessage;
        return reject({
          userMessage: 'Unexpected response.',
          code: res.statusCode,
          developerMessage: 'Unexpected response from vpc: ' + errorMess
        });
      }
      resolve(body.id);
    });
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
  getComputeInstance: getComputeInstance,
  getComputeInstanceList: getComputeInstanceList,
  verifyCredentials: verifyCredentials
};

