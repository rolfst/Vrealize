'use strict';
var target = require('../../../services/subscription');
var repoHelper = require('../../support/repository');
var chai = require('chai');
var stub = require('../../support/stub');

var should = chai.should();

describe('VPC Service Integration Specs', function () {

  describe('list', function () {
    describe('pagination', function () {

      it('should default to filter 10 offset 0 when nothing is provided', function (done) {
        target.list({subscriptionId: '1'}, null, function (err, vpcInstances) {
          should.not.exist(err);
          should.exist(vpcInstances);
          vpcInstances.length.should.eql(10);
          done();
        });
      });

      it('should paginate using the provided limit and offset parameter', function (done) {
        target.list({subscriptionId: '1', offset: 5, limit: 5}, null,
          function (err, foundVpc) {
            should.not.exist(err);
            should.exist(foundVpc);
            foundVpc.length.should.eql(5);
            done();
          });
      });
    });
  });
});
