'use strict';

var errors = require('../configs/errors.json');
var _ = require('lodash');

function getError(code, developerMessage) {
  var error = _.cloneDeep(errors[code.toString()]);
  if (!error) {
    throw Error('Specify a valid HTTP status code, received %s'.format(code));
  }
  error.developerMessage = developerMessage || error.developerMessage;
  return error;
}
module.exports = getError;
