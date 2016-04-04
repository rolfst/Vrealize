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
  database: {
    uri: {
      doc: 'Mongoose Database URI',
      format: String,
      default: 'mongodb://localhost/vpc',
      env: 'DB_URI'
    },
    log: {
      doc: 'Mongoose Debug Log Active',
      format: Boolean,
      default: true
    }
  },
  vpcConfig: {
    baseUrl: {
      doc: 'Base url to kpn vpc',
      format: String,
      default: 'https://vpc.kpnvdc.nl'
    },
    requestAttemptMax: {
      doc: 'Number of attemps to try a call to vpc',
      format: 'int',
      default: 2
    },
    tenant: {
      doc: 'Name of the tenant in vpc',
      format: String,
      default: 'ManagedServices'},
    username: {
      doc: 'Base url to kpn vpc',
      format: String,
      default: 'ManagedServices'},
    password: {
      doc: 'Base url to kpn vpc',
      format: String,
      default: 'WD683??ii184'}
  },
  proxyConfig: {
    enabled: {
      doc: 'Should a proxy be used when connecting to VPC',
      format: Boolean,
      default: true
    },
    address: {
      doc: 'The proxy address',
      format: String,
      default: 'http://10.151.233.196:3128'
    }
  },
  httpRequestConfig: {
    timeout: {
      doc: 'Timeout for HTTP requests',
      format: 'int',
      default: 1000
    }
  }
};
