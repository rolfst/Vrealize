'use strict';

var nock = require('nock');
var target = require('../../../services/vpc');
var repoHelper = require('../../repository_helper');
var config = require('../../../config');
var dbUri = config.get('database').uri;
var vpcConfig = config.get('vpcConfig');
var logger = require('../../../logger');
var stubs = require('../../stubs');
logger = logger.getLogger('vpc integration');

var clearDB = require('mocha-mongoose');
var _ = require('lodash');
var moment = require('moment');
var chai = require('chai');
var should = chai.should();

var resourcesPath = '/catalog-service/api/consumer/resources/';

clearDB(dbUri);
nock.disableNetConnect();

describe('VPC Service Integration', function () {
  describe('list', function () {
    var tokenValue = '#$#$#cdd^3@!fe9203&8Az==';
    var credentials;
    beforeEach(function (done) {
      credentials = {
        username: 'storedToken',
        password: 'just a password',
        tenant: 'storedToken'
      };
      var token = _.merge({},
        {
          token: tokenValue,
          expiry: moment().subtract(1, 'hours').toDate()
        }, credentials);
      repoHelper.createOne(token).then(function () {
        done();
      });
    });

    _.each(['tenant', 'username', 'password'], function (param) {
      it('requires ' + param, function (done) {
        delete credentials[param];
        target.list(credentials, null, function (err) {
          err.code.should.equal(400);
          done();
        });
      });
    });

    it('should return a list', function (done) {
      var expectedPayload = [stubs.compressed_windows_vm];
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?withExtendedData=true')
      .reply(200, {content: [stubs.windows_vm]});
      target.list(credentials, null, function callback(error, value) {
        request.done();
        should.not.exist(error);
        value.should.eql(expectedPayload);
        done();
      });
    });

    it('should imediately fail when an error other then 401 happens', function (done) {
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?withExtendedData=true')
      .reply(500);
      target.list(credentials, null, function callback(error) {
        request.done();
        error.code.should.eq(500);
        done();
      });
    });

    it('retries if 401', function (done) {
      var expectedPayload = [stubs.compressed_windows_vm];
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?withExtendedData=true')
      .times(1)
      .reply(401);
      var request2 = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?withExtendedData=true')
      .times(1)
      .reply(200, {content: [stubs.windows_vm]});
      target.list(credentials, null, function callback(error, value) {
        request.done();
        request2.done();
        should.not.exist(error);
        value.should.eql(expectedPayload);
        done();
      });
    });

    it('returns 401 if attempt limit reached', function (done) {
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?withExtendedData=true')
      .times(vpcConfig.requestAttemptMax)
      .reply(401);
      target.list(credentials, null, function callback(error) {
        request.done();
        error.code.should.eq(401);
        done();
      });
    });

  });

  describe('#get', function () {
        done();
      });
    });
  });

  describe('#get', function () {
    var params;
    var tokenValue = '#$#$#cdd^3@!fe9203&8Az==';

    beforeEach(function () {
      params = {
        tenant: 'someTenant',
        username: 'someUser',
        password: 'somePass',
        resourceId: 'someResourceId'
      };
    });

    _.each(['tenant', 'username', 'password', 'resourceId'], function (param) {
      it('requires ' + param, function (done) {
        delete params[param];
        target.get(params, null, function (err) {
          err.code.should.equal(400);
          done();
        });
      });
    });

    describe('when params are ok', function () {
      var credentials;
      beforeEach(function (done) {
        params = {
          tenant: 'someTenant',
          username: 'someUser',
          password: 'somePass',
          resourceId: 'someResourceId'
        };
        credentials = {
          tenant: 'someTenant',
          username: 'someUser',
          password: 'somePass'
        };
        var token = _.merge({},
          {
            token: tokenValue,
            expiry: moment().subtract(1, 'hours').toDate()
          }, credentials);
        repoHelper.createOne(token).then(function () {
          done();
        });
      });

      it('should return a vm', function (done) {
        var request = nock(vpcConfig.baseUrl)
        .get(resourcesPath + 'someResourceId')
        .reply(200, stubs.windows_vm);
        target.get(params, null, function callback(error, value) {
          request.done();
          should.not.exist(error);
          value.should.eql(stubs.compressed_windows_vm);
          done();
        });
      });
    });
  });
});
