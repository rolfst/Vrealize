'use strict';

require('sinon');
var chai = require('chai');
var expect = chai.expect;
var service = require('../../../services/vpc');
var _ = require('lodash');

describe('VPC Service', function () {

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
