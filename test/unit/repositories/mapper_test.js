'use strict';

var stubs = require('../../stubs/index');
var blueprints = require('../../blueprints/index');

var target = require('../../../repositories/mapper');

describe.only('Mapper', function () {
  describe('toComputeInstance', function () {
    it('should translate a VPC machine to a compute instance', function () {
      var expected = blueprints.compute_instance_vpc_windows;
      target(stubs.windows_vm).should.eql(expected);
    });
  });
});
