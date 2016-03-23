'use strict';

var vpcRepo = require('../repositories/vpc');
var _ = require('lodash');
var getError = require('../lib/error.js');
var util = require('util');

var defaultPagination = {limit: 10, offset: 0};
var paginationProperties = ['limit', 'offset'];


function list(payload, message, callback) {
  var filter = _.pick(payload, ['subscriptionId']);
  if (_.isEmpty(filter.subscriptionId)) {
    return callback(getError('400', 'Please provide a subscriptionId'), null);
  }

  var pagination = _.pick(payload, paginationProperties);
  pagination = _.defaults(pagination, defaultPagination);
  vpcRepo.listAsync(filter, pagination).asCallback(callback);
}

var service = {
  list: list,
};

module.exports = service;
