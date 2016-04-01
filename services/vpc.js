'use strict';

var vpcRepo = require('../repositories/vpc');
var _ = require('lodash');
var getError = require('../lib/error.js');

var defaultPagination = {limit: 10, offset: 0};
var paginationProperties = ['limit', 'offset'];

var requiredParams = ['tenant', 'username', 'password'];
var BAD_REQUEST = 400;

function list(payload, message, callback) {
  var filter = _.pick(payload, requiredParams);
  if (!filter.username || !filter.password || !filter.tenant) {
    return callback(getError(BAD_REQUEST, 'Please provide credentials'), null);
  }

  var pagination = _.pick(payload, paginationProperties);
  pagination = _.defaults(pagination, defaultPagination);
  return vpcRepo.listAsync(filter, pagination).asCallback(callback);
}

function get(payload, headers, callback) {
  var filter = _.pick(payload, requiredParams.concat('resourceId'));
  if (!filter.username || !filter.password || !filter.tenant || !filter.resourceId) {
    return callback(getError(BAD_REQUEST, 'Please provide credentials'), null);
  }
  return vpcRepo.getAsync(filter).asCallback(callback);
}

var service = {
  list: list,
  get: get
};

module.exports = service;
