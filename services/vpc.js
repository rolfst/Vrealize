'use strict';

var vpcRepo = require('../repositories/vpc');
var vpcConfig = require('../config').get('vpcConfig');
var _ = require('lodash');
var getError = require('../lib/error.js');
var retry = require('bluebird-retry');
var logger = require('../logger').getLogger('VPC Service');

var paginationProperties = ['limit', 'offset'];
var requiredParams = ['externalId', 'username', 'password'];
var BAD_REQUEST = 400;
var UNAUTHORIZED = 401;
var SERVER_ERROR = 500;
var VPC_LOGIN_ERROR = 90135;

function handleError(err) {
  logger.debug(err, 'Cannot reach VPC');
  if (err.statusCode || err.failure) {
    var normalizedError = err.failure || err;
    if (!_.includes([BAD_REQUEST, UNAUTHORIZED], normalizedError.statusCode)) {
      throw new retry.StopError(err);
    }
  }
  throw err;
}

function handleMaxAttemptsError(err) {
  logger.error(err, 'VPC is unreachable');
  if (err.statusCode || err.failure) {
    var normalizedError = err.failure || err;
    var message = 'Unable to connect to VPC';
    var statusCode = normalizedError.statusCode || SERVER_ERROR;
    if (_.has(normalizedError.error, 'errors')) {
      var error = _.first(normalizedError.error.errors);
      if (error.code === VPC_LOGIN_ERROR) {
        statusCode = UNAUTHORIZED;
        message = 'Unable to login to VPC';
      }
    }
    throw getError(statusCode, message);
  }
  throw getError(SERVER_ERROR, 'Unknown error occurred');
}

function resetTokenAndRetry(err, username) {
  return vpcRepo.resetToken(username)
    .then(function () {
      handleError(err);
    });
}

function tryList(filter, pagination) {
  return vpcRepo.login(filter)
    .then(function (token) {
      var options = _.defaults({}, filter, {token: token});
      return vpcRepo.listAsync(options, pagination);
    }).catch(function (err) {
      return resetTokenAndRetry(err, filter.username);
    });
}

function tryGet(filter) {
  return vpcRepo.login(filter)
    .then(function (token) {
      var options = {
        token: token,
        resourceId: filter.resourceId
      };
      return vpcRepo.getAsync(options);
    }).catch(function (err) {
      return resetTokenAndRetry(err, filter.username);
    });
}

function list(payload, message, callback) {
  var filter = _.pick(payload, requiredParams);
  if (!filter.username || !filter.password || !filter.externalId) {
    return callback(getError(BAD_REQUEST, 'Please provide credentials'), null);
  }
  filter.forceLogin = payload.forceLogin || false;
  var pagination = _.pick(payload, paginationProperties);
  return retry(function () {
    return tryList(filter, pagination);
  }, { 'max_tries': vpcConfig.requestAttemptMax })
    .catch(handleMaxAttemptsError)
    .asCallback(callback);
}

function get(payload, headers, callback) {
  var filter = _.pick(payload, requiredParams.concat('resourceId'));
  if (!filter.username || !filter.password || !filter.externalId || !filter.resourceId) {
    return callback(getError(BAD_REQUEST, 'Please provide credentials'), null);
  }
  filter.forceLogin = payload.forceLogin || false;
  return retry(function () {
    return tryGet(filter);
  }, { 'max_tries': vpcConfig.requestAttemptMax })
    .catch(handleMaxAttemptsError).asCallback(callback);
}

var service = {
  list: list,
  get: get
};

module.exports = service;
