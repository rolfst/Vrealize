'use strict';

require('../../../helper');
var repoHelper = require('../../../repository_helper');
var moment = require('moment');
var mongoose = require('../../../../repositories/mongoose');
var config = require('../../../../config');
var dbUri = config.get('database').uri;
var clearDB = require('mocha-mongoose');
var chai = require('chai');
var should = chai.should();
var logger = require('../../../../logger').getLogger('proxy test'); //eslint-disable-line no-unused-vars

clearDB(dbUri);

describe('vpc proxy', function () {
  beforeEach(function (done) {
    if (mongoose.connection.db) { return done(); }
    mongoose.connect(dbUri, done);
  });

  describe('verification of token', function () {
    var token = null;
    var expected;

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
        .then(function (data) {
          logger.debug('second %j', data);
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
});
