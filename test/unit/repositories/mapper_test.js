'use strict';

var stubs = require('../../stubs/index');
var blueprints = require('../../blueprints/index');

var target = require('../../../repositories/mapper');

var _ = require('lodash');

describe('Mapper', function () {
  describe('toComputeInstance', function () {
    it('should translate a VPC machine to a compute instance', function () {
      var expected = blueprints.compute_instance_vpc_windows;
      target(stubs.windows_vm).should.eql(expected);
    });

    describe('operatingSystem', function () {
      describe('TPL_CentOS_6.7', function () {
        it('should return CentOS 6.7', function () {
          _.get(target(stubs.centos_vm), 'operatingSystem')
            .should.eql('CentOS 6.7');
        });
      });

      describe('TPL_W2012R2', function () {
        it('should return Windows Server 2012 R2', function () {
          _.get(target(stubs.windows_vm), 'operatingSystem')
            .should.eql('Windows Server 2012 R2');
        });
      });

      describe('TPL_Ubuntu_16.04LTS_Server-14197867', function () {
        it('should return Ubuntu 16.04', function () {
          _.get(target(stubs.ubuntu_vm), 'operatingSystem')
            .should.eql('Ubuntu 16.04');
        });
      });

      describe('TPL_Ubuntu14-Desktop-58248026', function () {
        it('should return Ubuntu 14.04', function () {
          _.get(target(stubs.ubuntu_desktop_vm), 'operatingSystem')
            .should.eql('Ubuntu 14.04');
        });
      });
    });

    describe('os', function () {
      describe('TPL_CentOS_6.7', function () {
        it('should return centos_6.7', function () {
          _.get(target(stubs.centos_vm), 'os')
            .should.eql('centos_6.7');
        });
      });

      describe('TPL_W2012R2', function () {
        it('should return windows_server_2012_r2', function () {
          _.get(target(stubs.windows_vm), 'os')
            .should.eql('windows_server_2012_r2');
        });
      });

      describe('TPL_Ubuntu_16.04LTS_Server-14197867', function () {
        it('should return ubuntu_16.04', function () {
          _.get(target(stubs.ubuntu_vm), 'os')
            .should.eql('ubuntu_16.04');
        });
      });

      describe('TPL_Ubuntu14-Desktop-58248026', function () {
        it('should return ubuntu_14.04', function () {
          _.get(target(stubs.ubuntu_desktop_vm), 'os')
            .should.eql('ubuntu_14.04');
        });
      });
    });
  });
});
