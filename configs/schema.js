'use strict';

module.exports = {
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'demo', 'integration', 'test', 'development'],
    default: 'production',
    env: 'NODE_ENV'
  },
  // ZSS Service Configuration
  vpcService: {
    sid: {
      doc: 'The service name identifier',
      format: String,
      default: 'VPC'
    },
    broker: {
      doc: 'ZSS Broker Backend Address',
      format: String,
      default: 'tcp://127.0.0.1:7776'
    },
    heartbeat: {
      doc: 'ZSS Service heartbeat interval in ms',
      format: 'int',
      default: 1000
    }
  },
  logging: {
    level: {
      doc: 'Active log level',
      format: String,
      default: 'debug'
    },
    timeFormat: {
      doc: 'Timestamp format used, using moment formatter',
      format: String,
      default: 'YYYY-MM-DD HH:mm:ss'
    },
    messageFormat: {
      doc: 'Log message format used',
      format: String,
      default: '%time | %logger::%level - %msg'
    }
  },
  vpcConfig: {

  },
};
