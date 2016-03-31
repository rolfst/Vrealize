'use strict';

require('../../../helper');
var repoHelper = require('../../../repository_helper');
var stubs = require('../../../stubs');
var config = require('../../../../config');
var vpcConfig = config.get('vpcConfig');
var vpc = require('../../../../repositories/proxy/vpc');
var dbUri = config.get('database').uri;
var logger = require('../../../../logger').getLogger('proxy test'); //eslint-disable-line no-unused-vars

var _ = require('lodash');
var moment = require('moment');
var mongoose = require('../../../../repositories/mongoose');
var clearDB = require('mocha-mongoose');
var nock = require('nock');
var chai = require('chai');
var should = chai.should();

var loginPath = '/identity/api/tokens';

clearDB(dbUri);
nock.disableNetConnect();

describe('vpc proxy', function () {
  beforeEach(function (done) {
    if (mongoose.connection.db) { return done(); }
    mongoose.connect(dbUri, done);
  });

  describe('verification of token', function () {
    var token = null;
    var expected;
    afterEach(function (done) {
      clearDB(dbUri);
      done();
    });
    beforeEach(function (done) {
      repoHelper.createOne()
        .then(function (data) {
          token = data;
          expected = {
            username: data.username,
            expiry: data.expiry,
            token: data.token,
            createdAt: data.createdAt
          };
        })
        .then(function () {
          var expiredToken = repoHelper.expiredToken();
          expiredToken.username = 'anExpiredToken';
          return repoHelper.createOne(expiredToken);
        })
        .then(function () {
          done();
        })
        .catch(done);
    });
    it('should find token', function (done) {
      should.exist(token);
      repoHelper.findById(token.id, function (e, data) {
        data.username.should.equal(expected.username);
        var expiryDate = moment(data.expiry).toISOString();
        expiryDate.should.equal(moment(expected.expiry).toISOString());
        done();
      });
    });
    it('should find expired token', function (done) {
      repoHelper.findByUsername('anExpiredToken', function (e, data) {
        should.exist(data);
        data.username.should.equal('anExpiredToken');
        done();
      });
    });
    it('should fail when no token is created', function (done) {
      repoHelper.createOne({tenant: '', expiry: '', token: ''}).catch(function (e) {
        should.exist(e);
        e.message.should.eql('Token validation failed');
        done();
      });
    });

  });
  describe('verification of token', function () {
    beforeEach(function (done) {
      var expiredToken = repoHelper.expiredToken();
      expiredToken.username = 'anExpiredToken';
      return repoHelper.createOne(expiredToken)
      .then(function () {
        done();
      })
      .catch(done);
    });
    afterEach(function (done) {
      clearDB(dbUri);
      done();
    });
    it('should not validate the token when token has expired', function (done) {
      var credentials = {username: 'anExpiredToken', password: 'password'};
      var verificationResult = vpc.verifyCredentials(credentials);
      verificationResult.should.eventually.have.length(2);
      verificationResult.spread(function (options, fetchedToken) {
        options.should.eql(credentials);
        fetchedToken.should.be.false; //eslint-disable-line no-unused-expressions
        done();
      });
    });
    it('should not validate the token when token is not in database', function (done) {
      var credentials = {username: 'notStoredTenant', password: 'password'};
      var verificationResult = vpc.verifyCredentials(credentials);
      verificationResult.should.eventually.have.length(2);
      verificationResult.spread(function (options, fetchedToken) {
        options.should.eql(credentials);
        fetchedToken.should.be.false; //eslint-disable-line no-unused-expressions
        done();
      });
    });
    it('should validate the token for use', function (done) {
      var tokenValue = '#$#$#cdd^3@!fe9203&8Az==';
      var credentials = {
        username: 'storedToke',
        password: 'just a password',
        token: tokenValue,
        expiry: moment().add(1, 'hours').toDate()
      };

      repoHelper.createOne(credentials).then(function () {
        return vpc.verifyCredentials(credentials);
      })
      .spread(function (options, token) {
        token.should.eql(tokenValue);
        done();
      });
    });
  });
  describe('login', function () {
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
      var token = _.merge({
        token: tokenValue,
        expiry: moment().add(1, 'hours').toDate()
      }, credentials);
      repoHelper.createOne(token).then(function () {
        done();
      });
    });

    it('should return the token when one is provided', function () {
      var loggedInToken = vpc.login(credentials, tokenValue);
      return loggedInToken.should.eventually.eql(tokenValue);
    });
    it('should call to vpc for a token', function (done) {
      var request = nock(vpcConfig.baseUrl)
      .post(loginPath)
      .reply(200, stubs.access_token);
      vpc.login(credentials).then(function (token) {
        request.done();
        token.should.eql(stubs.access_token.id);
        done();
      });
    });
    it('should handle a normal error from vpc', function (done) {
      var errorRes = '{"message": "test error"}';
      var request = nock(vpcConfig.baseUrl)
      .post(loginPath)
      .reply(400, errorRes);
      vpc.login(credentials)
      .catch(function (error) {
        request.done();
        error.code.should.eql(400);
        error.developerMessage.should.eql('Unexpected response from vpc: ' + JSON.parse(errorRes).message);
        done();
      });
    });
    it('should store a new token in the database', function (done) {
      var request = nock(vpcConfig.baseUrl)
      .post(loginPath)
      .reply(200, stubs.access_token);
      var username = 'previouslyUnstored';
      var newCredentials = {
        username: username,
        password: 'besafe',
        tenant: 'previouslyUnstored'
      };
      vpc.login(newCredentials).then(function (token) {
        request.done();
        token.should.eql(stubs.access_token.id);
      })
      .then(function () {
        repoHelper.findByUsername(username, function (err, storedToken) {
          storedToken.username.should.eql(username);
          done();
        });
      });
    });
  });
});
