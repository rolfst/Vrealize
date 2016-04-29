'use strict';

var vpcConfig = require('../config').get('vpcConfig');
var logger = require('../logger');
logger = logger.getLogger('Proxy');
var Token = require('./dao/token');
var moment = require('moment');
var _ = require('lodash');
var toCompactPayload = require('./mapper');
var httpRequest = require('./http_request');
var util = require('util');

var baseUrl = vpcConfig.baseUrl;
var loginPath = '/identity/api/tokens';
var resourcesPath = '%s/catalog-service/api/consumer/resources/';
var resourcePath = '%s/catalog-service/api/consumer/resources/%s';

var defaultHeaders = {
  'Content-Type': 'application/json'
};
var loginDefaults = {
  url: baseUrl + loginPath,
  method: 'POST',
  json: true
};
var resourcesDefaults = {
  url: util.format(resourcesPath, baseUrl),
  method: 'GET',
  json: true
};

function isBeforeExpiryCutoff(date) {
  var now = moment();
  return moment(now).isBefore(date);
}

function resetToken(username) {
  logger.debug('Reseting token for %s', username);
  return Token.remove({username: username});
}

function verifyCredentials(credentials) {
  return Token.findOne({username: credentials.username}).then(function (token) {

    if (!token) {
      return [credentials, null];
    }

    if (isBeforeExpiryCutoff(token.expiry)) {
      logger.debug('Found token %s', token.token);
      return [credentials, token.token];
    }
    return [credentials, null];
  });
}

function handleLogin(credentials, token) {
  if (token) {return token;}
  logger.debug('No token found for %s', credentials.username);
  var vpcPayload = {
    tenant: credentials.externalId,
    username: credentials.username,
    password: credentials.password
  };
  var postOptions = {method: 'POST', body: vpcPayload};
  var httpOptions = _.defaults({}, loginDefaults, defaultHeaders, postOptions);
  return httpRequest(httpOptions).then(function (body) {
    logger.debug(body, 'Logged into VPC');
    var storableCredentials = _.pick(credentials, ['username']);
    var result = {
      token: body.id,
      expiry: moment(body.expires).toDate()
    };
    var baseToken = _.merge(storableCredentials, result);
    return Token.update({username: credentials.username}, baseToken, {upsert: true})
    .then(function () {
      return body.id;
    });
  });
}

function login(options) {
  if (options.forceLogin === true) {
    logger.debug('Login is forced');
    return handleLogin(options, null);
  } else {
    return verifyCredentials(options)
      .spread(handleLogin);
  }
}

function listAsync(filter, pagination) {
  var token = filter.token;
  var paging = _.isEmpty(pagination) ? {} : {
    $skip: pagination.offset,
    $top: pagination.limit
  };
  var options = _.defaults({}, filter, pagination);
  var resourceHeaders = _.defaults({}, defaultHeaders);
  resourceHeaders = _.defaults({}, resourceHeaders, {Authorization: 'Bearer ' + token});
  var body = _.pick(options, []);
  var $filter = 'resourceType%2Fname%20eq%20%27Virtual%20Machine%27';
  var tempQuery = _.defaults({}, body, paging, {withExtendedData: true, $filter: $filter});
  var query = _.keys(tempQuery).sort().map(function (key) {
    return key + '=' + tempQuery[key];
  }).join('&');
  var httpOptions = _.defaults({},
                               {body: body},
                               resourcesDefaults);
  httpOptions.url = resourcesDefaults.url + '?' + query;
  httpOptions.headers = resourceHeaders;
  return httpRequest(httpOptions)
  .then(function (response) {
    logger.debug(body, 'VPC list has replied');
    return response.content.map(toCompactPayload);
  });
}

function getAsync(filter) {
  var token = filter.token;
  var resourceId = filter.resourceId;
  var resourceHeaders = _.defaults({}, defaultHeaders);
  resourceHeaders = _.defaults({}, resourceHeaders, {Authorization: 'Bearer ' + token});
  var httpOptions = {
    url: util.format(resourcePath, baseUrl, resourceId),
    headers: resourceHeaders,
    json: true,
    method: 'GET'
  };
  return httpRequest(httpOptions).then(function (body) {
    logger.debug(body, 'VPC get has replied');
    return toCompactPayload(body);
  });
}

module.exports = {
  login: login,
  resetToken: resetToken,
  listAsync: listAsync,
  getAsync: getAsync
};
