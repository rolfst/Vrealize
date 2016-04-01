'use strict';

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
var nock = require('nock');
var chai = require('chai');
var should = chai.should();

var resourcesUrl = '/catalog-service/api/consumer/resources?withExtendedData=true';

clearDB(dbUri);
nock.disableNetConnect();

describe('VPC Service Integration', function () {
  describe('list', function () {
    var tokenValue = '#$#$#cdd^3@!fe9203&8Az==';
    var credentials = {
      username: 'storedToken',
      password: 'just a password',
      tenant: 'storedToken'
    };
    afterEach(function (done) {
      clearDB(dbUri);
      done();
    });
    beforeEach(function (done) {
      var token = _.merge({},
        {
          token: tokenValue,
          expiry: moment().subtract(1, 'hours').toDate()
        }, credentials);
      repoHelper.createOne(token).then(function () {
        done();
      });
    });
    it('should return an error because no credentials are provided', function (done) {
      var missingCredentials = [{username: 'username', password: 'password', execute: function () {}},
        {password: 'password', tenant: 'tenant', execute: function () {}},
        {username: 'username', tenant: 'tenant', execute: function () {done();}}
      ];
      missingCredentials.map(function (credential) {
        target.list(credential, null, function callback(error, value) {
          should.not.exist(value);
          should.exist(error);
          error.code.should.eql(401);
          credential.execute();
        });
      });
    });

    it.only('should return a list', function (done) {
      var request = nock(vpcConfig.baseUrl)
      .post(resourcesUrl)
      .reply(200, []);
      target.list(credentials, null, function callback(error, value) {
        request.done();
        logger.debug('%j', error);
        should.not.exist(error);
        should.exist(value);
        value.should.be.empty; //eslint-disable-line
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
        service.get(params, null, function (err) {
          expect(err.code).to.equal(400);
          done();
        });
      });
    });
  });
});
