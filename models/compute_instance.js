'use strict';

var _ = require('lodash');

var whitelist = ['id', 'name', 'operatingSystem', 'os', 'resources'];

var defaults = _.reduce(whitelist, function (acc, property) {
  acc[property] = null;
  return acc;
}, {});

function toComputeInstance(attrs) {
  var props = _.pick(attrs, whitelist);
  return _.defaults({}, props, defaults);
}

module.exports = toComputeInstance;
