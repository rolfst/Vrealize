'use strict';

var nock = require('nock');
var target = require('../../../services/vpc');
var repoHelper = require('../../repository_helper');
var config = require('../../../config');
var dbUri = config.get('database').uri;
var vpcConfig = config.get('vpcConfig');
var logger = require('../../../logger');
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
    afterEach(function (done) {
      clearDB(dbUri);
      done();
    });
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
      var request = nock(vpcConfig.baseUrl)
      .get(resourcesPath + '?withExtendedData=true')
      .reply(200, []);
      target.list(credentials, null, function callback(error, value) {
        request.done();
        should.not.exist(error);
        should.exist(value);
        done();
      });
    });
  });

  describe('#get', function () {
    var params;

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
  });
});
