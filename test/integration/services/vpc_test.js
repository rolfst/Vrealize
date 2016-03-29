'use strict';
var target = require('../../../services/vpc');
var chai = require('chai');
//var stub = require('../../support/stub');

var should = chai.should();

describe('VPC Service Integration Specs', function () {

  describe('list', function () {
    describe('pagination', function () {

      it('should default to filter 10 offset 0 when nothing is provided', function (done) {
        target.list({credentials: {tenant: '1', password: 'heh heh'}, resourceId: '000'}, null, function (err, vpcInstances) {
          should.not.exist(err);
          should.exist(vpcInstances);
          vpcInstances.length.should.eql(10);
          done();
        });
      });

      it('should paginate using the provided limit and offset parameter', function (done) {
        target.list({credentials: {tenant: '1', password: 'heh heh'}, resourceId: '000'}, null,
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
