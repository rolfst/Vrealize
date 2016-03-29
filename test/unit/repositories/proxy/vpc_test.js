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

describe.only('vpc proxy', function () {
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
            tenant: data.tenant,
            expiry: data.expiry,
            token: data.token,
            createdAt: moment(data.createdAt).toISOString()
          };
          return repoHelper.createSecond();
        })
        .then(function () { done(null); })
        .catch(done);
    });
    it('should find token', function (done) {
      should.exist(token);
      repoHelper.findById(token.id, function (e, data) {
        data.tenant.should.equal(expected.tenant);
        data.expiry.should.equal(expected.expiry);
        done();
      });
    });
    it('should find expired token', function (done) {
      repoHelper.findByTenant('expiredTenantToken', function (e, data) {
        should.exist(data);
        data.tenant.should.equal('expiredTenantToken');
        done();
      });
    });
    it('should fail when no token is created', function (done) {
      repoHelper.createOne({tenant: '', expiry: '', token: ''}).catch(function (e) {
        should.exist(e);
        done();
      });
    });
  });
});
