'use strict';

var proxyConfig = require('../config').get('proxyConfig');
var request = require('request-promise');
var HttpsProxyAgent = require('https-proxy-agent');
var _ = require('lodash');

var proxyOptions = {};
if (proxyConfig.enabled) {
  var agent = new HttpsProxyAgent(proxyConfig.address);
  proxyOptions = {
    agent: agent,
    timeout: 1000
  };
}

function httpRequest(options) {
  return request(_.merge({}, options, proxyOptions));
}

module.exports = httpRequest;
