'use strict';

var _ = require('lodash');
var toModel = require('../models/compute_instance');

var VPC_RESOURCES = ['MachineMemory', 'MachineStorage', 'MachineCPU'];

function parseOperatingSystem(vpcInstance) {
  var entries = _.get(vpcInstance, 'resourceData.entries');
  var rawOSData = _.find(entries, function (entry) {
    return _.get(entry, 'key') === 'MachineGuestOperatingSystem';
  });

  var rawOS = _.get(rawOSData, 'value.value');

  if (rawOS.match(/windows server 2012 r2 standard/i)) {
    return 'windows server 2012 r2';
  }
  return _.lowerCase(rawOS);
}

function parseOS(operatingSystem) {
  if (operatingSystem.match(/windows/)) {
    return 'windows';
  }
  return 'linux';
}

function parseResources(vpcInstance) {
  var entries = _.get(vpcInstance, 'resourceData.entries');
  var vpcResources = _.chain(entries)
                        .filter(function (entry) {
                          return _.includes(VPC_RESOURCES, _.get(entry, 'key'));
                        }).reduce(function (resourceMapping, resource) {
                          resourceMapping[resource.key] = _.get(resource, 'value.value');
                          return resourceMapping;
                        }, {}).value();
  return {
    cpu: _.get(vpcResources, 'MachineCPU'),
    memory: _.get(vpcResources, 'MachineMemory'),
    diskSpace: _.get(vpcResources, 'MachineStorage')
  };
}

function toComputeInstance(vpcInstance) {
  var operatingSystem = parseOperatingSystem(vpcInstance);
  var os = parseOS(operatingSystem);

  var instance = {
    id: vpcInstance.id,
    name: vpcInstance.name,
    operatingSystem: operatingSystem,
    os: os,
    resources: parseResources(vpcInstance)
  };
  return toModel(instance);
}

module.exports = toComputeInstance;
