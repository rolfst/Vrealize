'use strict';

var proxyConfig = require('../config').get('proxyConfig');
var httpRequestConfig = require('../config').get('httpRequestConfig');
var request = require('request-promise');
var HttpsProxyAgent = require('https-proxy-agent');
var _ = require('lodash');

var proxyOptions = { timeout: httpRequestConfig.timeout };
if (proxyConfig.enabled) {
  var agent = new HttpsProxyAgent(proxyConfig.address);
  proxyOptions.agent = agent;
}

function httpRequest(options) {
  return request(_.merge({}, options, proxyOptions));
}

module.exports = httpRequest;
