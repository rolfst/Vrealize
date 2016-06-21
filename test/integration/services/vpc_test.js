'use strict';

var nock = require('nock');
var target = require('../../../services/vpc');
var repoHelper = require('../../repository_helper');
var config = require('../../../config');
var dbUri = config.get('database').uri;
var vpcConfig = config.get('vpcConfig');
var logger = require('../../../logger');
var stubs = require('../../stubs');
var blueprints = require('../../blueprints/index');

logger = logger.getLogger('vpc integration');

var clearDB = require('mocha-mongoose');
var _ = require('lodash');
var moment = require('moment');
var chai = require('chai');
var should = chai.should();

var loginPath = '/identity/api/tokens';
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
        externalId: 'storedToken'
      };
      var token = _.merge({},
        {
          token: tokenValue,
          expiry: moment().add(1, 'hours').toDate()
        }, credentials);
      repoHelper.createOne(token).then(function () {
        done();
      });
    });

    _.each(['externalId', 'username', 'password'], function (param) {
      it('requires ' + param, function (done) {
        delete credentials[param];
        target.list(credentials, null, function (err) {
          err.code.should.equal(400);
          done();
        });
      });
    });

    it('should return a list', function (done) {
      var expectedPayload = [blueprints.compute_instance_vpc_windows];
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&withExtendedData=true')
      .reply(200, {content: [stubs.windows_vm]});
      target.list(credentials, null, function callback(error, value) {
        request.done();
        should.not.exist(error);
        value.should.eql(expectedPayload);
        done();
      });
    });

    it('should login and return a list if forceLogin is set', function (done) {
      var expectedPayload = [blueprints.compute_instance_vpc_windows];
      var loginRequest = nock(vpcConfig.baseUrl)
      .post(loginPath)
      .reply(200, stubs.dummy_access_token);
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&withExtendedData=true')
      .reply(200, {content: [stubs.windows_vm]});
      credentials.forceLogin = true;
      target.list(credentials, null, function callback(error, value) {
        request.done();
        loginRequest.done();
        should.not.exist(error);
        value.should.eql(expectedPayload);
        done();
      });
    });

    it('should imediately fail when an error other then 401 happens', function (done) {
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&withExtendedData=true')
      .reply(500);
      target.list(credentials, null, function callback(error) {
        request.done();
        error.code.should.eq(500);
        done();
      });
    });

    it('retries if 401', function (done) {
      var loginRequest = nock(vpcConfig.baseUrl)
      .post(loginPath)
      .reply(200, stubs.dummy_access_token);
      var expectedPayload = [blueprints.compute_instance_vpc_windows];
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&withExtendedData=true')
      .times(1)
      .reply(401);
      var request2 = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&withExtendedData=true')
      .times(1)
      .reply(200, {content: [stubs.windows_vm]});
      target.list(credentials, null, function callback(error, value) {
        request.done();
        request2.done();
        loginRequest.done();
        should.not.exist(error);
        value.should.eql(expectedPayload);
        done();
      });
    });

    it('retries if 401 with VPC_LOGIN_ERROR', function (done) {
      var loginRequest = nock(vpcConfig.baseUrl)
      .post(loginPath)
      .reply(200, stubs.dummy_access_token);
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&withExtendedData=true')
      .times(1)
      .reply(401);
      var request2 = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&withExtendedData=true')
      .times(1)
      .reply(401, {
        statusCode: 401,
        errors: [
          {code: 90135,
            message: 'bad login'
          }]
      });
      target.list(credentials, null, function callback(error) {
        request.done();
        request2.done();
        loginRequest.done();
        console.log(error); //eslint-disable-line no-console
        should.exist(error);
        done();
      });
    });
    it('returns 401 if attempt limit reached', function (done) {
      var loginRequest = nock(vpcConfig.baseUrl)
      .post(loginPath)
      .reply(200, stubs.dummy_access_token);
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&withExtendedData=true')
      .times(vpcConfig.requestAttemptMax)
      .reply(401);
      target.list(credentials, null, function callback(error) {
        loginRequest.done();
        request.done();
        logger.debug(null, '%j', error);
        error.code.should.eq(401);
        done();
      });
    });

    describe('pagination', function () {
      it('should paginate using the limit and offset parameter', function (done) {
        var expectedPayload = [blueprints.compute_instance_vpc_windows];
        var request = nock(vpcConfig.baseUrl)
        .get(resourcesPath + '?$filter=resourceType%2Fname%20eq%20%27Virtual%20Machine%27&$skip=2&$top=1&withExtendedData=true')
        .reply(200, {content: [stubs.windows_vm]});
        var payload = _.defaults({}, credentials, {limit: 1, offset: 2});
        target.list(payload, null, function callback(error, value) {
          request.done();
          should.not.exist(error);
          value.should.eql(expectedPayload);
          done();
        });
      });
    });
  });

  describe('#get', function () {
    var params;
    var tokenValue = '#$#$#cdd^3@!fe9203&8Az==';

    beforeEach(function () {
      params = {
        externalId: 'someTenant',
        username: 'someUser',
        password: 'somePass',
        resourceId: 'someResourceId'
      };
    });

    _.each(['externalId', 'username', 'password', 'resourceId'], function (param) {
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
          externalId: 'someTenant',
          username: 'someUser',
          password: 'somePass',
          resourceId: 'someResourceId'
        };
        credentials = {
          externalId: 'someTenant',
          username: 'someUser',
          password: 'somePass'
        };
        var token = _.merge({},
          {
            token: tokenValue,
            expiry: moment().add(1, 'hours').toDate()
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
          value.should.eql(blueprints.compute_instance_vpc_windows);
          done();
        });
      });
    });
  });
});
