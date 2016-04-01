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
var resourcesPath = '%s/catalog-service/api/consumer/resources/?withExtendedData=true';
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

function login(options) {
  return verifyCredentials(options)
  .spread(function (credentials, token) {
    if (token) {return token;}
    var postOptions = {method: 'POST', body: credentials};
    var httpOptions = _.defaults({}, loginDefaults, defaultHeaders, postOptions);
    return httpRequest(httpOptions).then(function (body) {
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
    });
  });
}

function listAsync(filter, pagination) {
  var token = filter.token;
  var options = _.defaults({}, filter, pagination);
  var resourceHeaders = _.defaults({}, defaultHeaders);
  resourceHeaders = _.defaults({}, resourceHeaders, {Authorization: 'Bearer ' + token});
  var body = _.pick(options, []);
  var httpOptions = _.defaults({},
                               {body: body},
                               resourcesDefaults);
  httpOptions.headers = resourceHeaders;
  return httpRequest(httpOptions)
  .then(function (response) {
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
  return httpRequest(httpOptions).then(toCompactPayload);
}

module.exports = {
  login: login,
  listAsync: listAsync,
  getAsync: getAsync
};
