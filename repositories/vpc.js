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
    var vpcPayload = {
      tenant: credentials.externalId,
      username: credentials.username,
      password: credentials.password
    };
    var postOptions = {method: 'POST', body: vpcPayload};
    var httpOptions = _.defaults({}, loginDefaults, defaultHeaders, postOptions);
    return httpRequest(httpOptions).then(function (body) {
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
  });
}

function listAsync(filter, pagination) {
  var token = filter.token;
  var paging = {
    $skip: pagination.offset || 0,
    $top: pagination.limit || '10'
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
