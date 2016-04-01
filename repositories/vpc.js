'use strict';

var vpcConfig = require('../config').get('vpcConfig');
var logger = require('../logger');
logger = logger.getLogger('Proxy');
var request = require('request-promise');
var Token = require('./dao/token');
var getError = require('../lib/error');
var moment = require('moment');
var _ = require('lodash');

var baseUrl = vpcConfig.baseUrl;
var loginPath = '/identity/api/tokens';

var loginDefaults = {
  url: baseUrl + loginPath,
  headers: {
    'Content-Type': 'application/json'
  },
  json: true
};

function isBeforeExpiryCutoff(date) {
  var now = moment();
  return moment(date).isBefore(now.toISOString());
}

function verifyCredentials(credentials) {
  return Token.findOne({username: credentials.username}).then(function (token) {
    if (!token) {return [credentials, null];}
    if (isBeforeExpiryCutoff(token.expiry)) {
      return [credentials, token.token];
    }
    return [credentials, null];
  });
}

function login(options, attempt) {
  attempt = attempt || 1;
  return verifyCredentials(options)
  .spread(function (credentials, token) {
    if (token) {return token;}

    var httpOptions = _.defaults({}, loginDefaults, {method: 'POST', body: credentials});
    httpOptions.body = credentials;
    return request(httpOptions).then(function (body) {
      var storableCredentials = _.pick(credentials, ['username', 'tenant']);
      var result = {
        token: body.id,
        expiry: body.expiry
      };
      var baseToken = _.merge(storableCredentials, result);
      return Token.update({username: credentials.username}, baseToken, {upsert: true})
      .then(function () {
        return body.id;
      });
    }).catch(function (err) {
      if (!_.includes([401, 400], err.statusCode)) { //eslint-disable-line no-magic-numbers
        if (err.statusCode) {
          throw getError(err.statusCode,
                         'Unexpected response from vpc: ' + err.error.errors.map(function (error) {
                           return error.message;
                         })
                         .reduce(function (accValue, currValue) {
                           return currValue ? accValue + ', ' + currValue : accValue;
                         }));
        }
        throw getError('500', err.message);

      }
      if (attempt >= vpcConfig.requestAttemptMax) {
        throw getError(err.statusCode,
                       err.error.errors.map(function (obj) {
                         return obj.message;
                       })
                      .reduce(function (accValue, currValue) {
                        return currValue ? accValue + ', ' + currValue : accValue;
                      }));
      }
      return login(options, attempt + 1);
    });
  })
  .catch(function (reason) {
    if (!reason.statusCode) {throw reason;}
    var error = getError(reason.statusCode,
                         'Unexpected response from vpc: '
                         + reason.error.errors.map(function (obj) {
                           return obj.message;
                         })
                         .reduce(function (accValue, currValue) {
                           return currValue ? accValue + ', ' + currValue : accValue;
                         }));

    throw error;
  });
}

function fetchAllinstances(token, options, attempt) {
  attempt = attempt || 1;
  return [token, options];
}

function listAsync(filter, pagination) {
  var filteredProps = ['username', 'password', 'tenant'];
  var credentials = _.pick(filter, filteredProps);
  var options = _.defaults({}, filter, pagination);
  return login(credentials).then(function (token) {
    return fetchAllinstances(token, options);
  });
}

module.exports = {
  login: login,
  listAsync: listAsync
};
