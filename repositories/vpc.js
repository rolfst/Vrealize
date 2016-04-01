'use strict';

var vpcConfig = require('../config').get('vpcConfig');
var logger = require('../logger');
logger = logger.getLogger('Proxy');
var request = require('request-promise');
var Token = require('./dao/token');
var getError = require('../lib/error');
var moment = require('moment');
var _ = require('lodash');
var util = require('util');

var BAD_REQUEST = 400;
var UNAUTHORIZED = 401;

var baseUrl = vpcConfig.baseUrl;
var loginPath = '/identity/api/tokens';
var resourcesPath = '/catalog-service/api/consumer/resources/';

var headers = {headers: {
  'Content-Type': 'application/json'
}};
var loginDefaults = {
  url: baseUrl + loginPath,
  method: 'POST',
  json: true
};
var resourcesDefaults = {
  url: baseUrl + resourcesPath + '?withExtendedData=true',
  method: 'POST',
  json: true
};

function handleError(err, attempt) {
  if (!_.includes([BAD_REQUEST, UNAUTHORIZED], err.statusCode)) {
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
}
function isBeforeExpiryCutoff(date) {
  var now = moment();
  return moment(date).isBefore(now);
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

    var httpOptions = _.defaults({}, loginDefaults, headers, {method: 'POST', body: credentials});
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
      handleError(err, attempt);
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

function fetchAllinstances(token, options) {
  var resourceHeaders = _.defaults({}, headers, {Authorization: 'Bearer ' + token});
  var body = _.pick(options, []);
  var httpOptions = _.defaults({},
                               {body: body},
                               resourcesDefaults,
                               resourceHeaders);
  request(httpOptions).then(function (response) {
    return response;
  })
  .then(function mapResources(resources) {
    return resources;
  })
  .catch(function (e) {
    logger.debug('body: ', util.inspect(e, null, false));
  });
}

function fetchInstance(token, resourceId) {
  var httpOptions = {
    url: baseUrl + resourcesPath + resourceId,
    headers: {
      'Content-Type': 'application/json'
    },
    json: true,
    method: 'GET'
  };

  return request(httpOptions);
}

function listAsync(filter, pagination, attempt) {
  attempt = attempt || 1;
  var filteredProps = ['username', 'password', 'tenant'];
  var credentials = _.pick(filter, filteredProps);
  var options = _.defaults({}, filter, pagination);
  return login(credentials).then(function (token) {
    return fetchAllinstances(token, options);
  })
  .catch(function (error) {
    handleError(error, attempt);
    return listAsync(filter, pagination, attempt + 1);
  });
}

function getAsync(filter) {
  var filteredProps = ['username', 'password', 'tenant'];
  var credentials = _.pick(filter, filteredProps);
  return login(credentials).then(function (token) {
    return fetchInstance(token, filter.resourceId);
  });
}

module.exports = {
  login: login,
  listAsync: listAsync,
  getAsync: getAsync
};
