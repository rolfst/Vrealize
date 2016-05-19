'use strict';

var _ = require('lodash');

var whitelist = ['id'];

var defaults = {
  id: null
};

function toInstance(attrs) {
  // filter whitelisted properties
  var props = _.pick(attrs, whitelist);

  // set defaults on this
  return _.defaults({}, props, defaults);
}

module.exports = toInstance;
