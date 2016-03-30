'use strict';

var vpcRepo = require('../repositories/vpc');
var _ = require('lodash');
var getError = require('../lib/error.js');

var defaultPagination = {limit: 10, offset: 0};
var paginationProperties = ['limit', 'offset'];

var filteredProps = ['username', 'password', 'resourceId'];

function list(payload, message, callback) {
  var filter = _.pick(payload, filteredProps);
  if (!filter.username || !filter.password) {
    return callback(getError('400', 'Please provide credentials'), null);
  }

  var pagination = _.pick(payload, paginationProperties);
  pagination = _.defaults(pagination, defaultPagination);
  vpcRepo.listAsync(filter, pagination).asCallback(callback);
}

var service = {
  list: list
};

module.exports = service;
