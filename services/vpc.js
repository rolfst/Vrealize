'use strict';

var vpcRepo = require('../repositories/vpc');
var _ = require('lodash');
var getError = require('../lib/error.js');

var defaultPagination = {limit: 10, offset: 0};
var paginationProperties = ['limit', 'offset'];

var filteredProps = ['username', 'password', 'resourceId'];
var requiredGetParams = ['tenant', 'username', 'password', 'resourceId'];
var BAD_REQUEST = 400;

function list(payload, message, callback) {
  var filter = _.pick(payload, filteredProps);
  if (!filter.username || !filter.password) {
    return callback(getError(BAD_REQUEST, 'Please provide credentials'), null);
  }

  var pagination = _.pick(payload, paginationProperties);
  pagination = _.defaults(pagination, defaultPagination);
  vpcRepo.listAsync(filter, pagination).asCallback(callback);
}

function get(payload, headers, callback) {
  var filter = _.pick(payload, requiredGetParams);
  _.each(requiredGetParams, function (param) {
    if (!filter[param]) {
      return callback(getError(BAD_REQUEST, 'Missing required param: ' + param), null);
    }
  });

  return vpcRepo.getAsync(filter).asCallback(callback);
}

var service = {
  list: list,
  get: get
};

module.exports = service;
