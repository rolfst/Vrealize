'use strict';

require('../../helper');

var rewire = require('rewire');
var _ = require('lodash');
var moment = require('moment');
var mongoose = require('../../../repositories/mongoose');
var clearDB = require('mocha-mongoose');
var nock = require('nock');
var chai = require('chai');
var should = chai.should();

var repoHelper = require('../../repository_helper');
var stubs = require('../../stubs');
var config = require('../../../config');
var vpcConfig = config.get('vpcConfig');
var vpc = rewire('../../../repositories/vpc');
var dbUri = config.get('database').uri;
var logger = require('../../../logger').getLogger('proxy test'); //eslint-disable-line no-unused-vars

var loginPath = '/identity/api/tokens';

clearDB(dbUri);
nock.disableNetConnect();

describe('vpc repository', function () {
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
      repoHelper.createOne({externalId: '', expiry: '', token: ''}).catch(function (e) {
        should.exist(e);
        e.message.should.eql('Token validation failed');
        done();
      });
    });

  });
  describe('verification of token', function () {
    var verifyCredentials = vpc.__get__('verifyCredentials');
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
      var verificationResult = verifyCredentials(credentials);
      verificationResult.should.eventually.have.length(2);
      verificationResult.spread(function (options, fetchedToken) {
        options.should.eql(credentials);
        should.not.exist(fetchedToken);
        done();
      });
    });
    it('should not validate the token when token is not in database', function (done) {
      var credentials = {username: 'notStoredTenant', password: 'password'};
      var verificationResult = verifyCredentials(credentials);
      verificationResult.should.eventually.have.length(2);
      verificationResult.spread(function (options, fetchedToken) {
        options.should.eql(credentials);
        should.not.exist(fetchedToken);
        done();
      });
    });
    it('should validate the token for use', function (done) {
      var tokenValue = '#$#$#cdd^3@!fe9203&8Az==';
      var credentials = {
        username: 'storedToken',
        password: 'just a password',
        token: tokenValue,
        expiry: moment().add(1, 'hours').toDate()
      };

      repoHelper.createOne(credentials).then(function () {
        return verifyCredentials(credentials);
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
      externalId: 'storedToken'
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

    it('should call to vpc for a token', function (done) {
      var username = 'previouslyUnstored';
      var newCredentials = {
        username: username,
        password: 'besafe',
        externalId: 'previouslyUnstored'
      };
      var request = nock(vpcConfig.baseUrl)
      .post(loginPath)
      .reply(200, stubs.access_token);
      vpc.login(newCredentials).then(function (token) {
        request.done();
        token.should.eql(stubs.access_token.id);
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
        externalId: 'previouslyUnstored'
      };
      vpc.login(newCredentials).then(function (token) {
        request.done();
        token.should.eql(stubs.access_token.id);
      })
      .then(function () {
        repoHelper.findByUsername(username, function (err, storedToken) {
          storedToken.username.should.eql(username);
          storedToken.expiry.toISOString().should.eql(stubs.access_token.expires);
          done();
        });
      }).catch(function (e) {
        logger.debug('%j', e);
      });
    });
  });
});
