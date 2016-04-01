'use strict';

var vpcRepo = require('../repositories/vpc');
var vpcConfig = require('../config').get('vpcConfig');
var _ = require('lodash');
var getError = require('../lib/error.js');
var retry = require('bluebird-retry');

var defaultPagination = {limit: 10, offset: 0};
var paginationProperties = ['limit', 'offset'];
var requiredParams = ['externalId', 'username', 'password'];
var BAD_REQUEST = 400;
var UNAUTHORIZED = 401;

function handleError(err) {
  if (err.statusCode !== UNAUTHORIZED) {
    throw new retry.StopError(err);
  }
  throw err;
}

function handleFinalError(err) {
  if (err.statusCode) {
    throw getError(err.statusCode);
  }
  if (err.failure && err.failure.statusCode) {
    throw getError(err.failure.statusCode);
  }
  throw err;
}

function tryList(filter, pagination) {
  return vpcRepo.login(filter)
    .then(function (token) {
      var options = _.defaults({}, filter, pagination, {token: token});
      return vpcRepo.listAsync(options);
    }).catch(handleError);
}

function tryGet(filter) {
  return vpcRepo.login(filter)
    .then(function (token) {
      var options = {
        token: token,
        resourceId: filter.resourceId
      };
      return vpcRepo.getAsync(options);
    }).catch(handleError);
}

function list(payload, message, callback) {
  var filter = _.pick(payload, requiredParams);
  if (!filter.username || !filter.password || !filter.externalId) {
    return callback(getError(BAD_REQUEST, 'Please provide credentials'), null);
  }
  var pagination = _.pick(payload, paginationProperties);
  pagination = _.defaults(pagination, defaultPagination);
  return retry(function () {
    return tryList(filter, pagination);
  }, { 'max_tries': vpcConfig.requestAttemptMax })
    .catch(handleFinalError).asCallback(callback);
}

function get(payload, headers, callback) {
  var filter = _.pick(payload, requiredParams.concat('resourceId'));
  if (!filter.username || !filter.password || !filter.externalId || !filter.resourceId) {
    return callback(getError(BAD_REQUEST, 'Please provide credentials'), null);
  }
  return retry(function () {
    return tryGet(filter);
  }, { 'max_tries': vpcConfig.requestAttemptMax })
    .catch(handleFinalError).asCallback(callback);
}

var service = {
  list: list,
  get: get
};

module.exports = service;
