'use strict';

var _ = require('lodash');
var toModel = require('../models/compute_instance');

var VPC_RESOURCES = ['MachineMemory', 'MachineStorage', 'MachineCPU'];

function extractOperatingSystem(vpcInstance) {
  var entries = _.get(vpcInstance, 'resourceData.entries');
  var rawOSData = _.find(entries, function (entry) {
    return _.get(entry, 'key') === 'MachineBlueprintName';
  });

  var rawOS = _.get(rawOSData, 'value.value');

  if (_.includes(rawOS, 'W2012R2')) {
    return 'Windows Server 2012 R2';
  }

  if (_.includes(rawOS, 'Ubuntu14-Desktop')) {
    return 'Ubuntu 14.04';
  }

  return _.chain(rawOS)
    .replace('TPL_', '')
    .replace('_', ' ')
    .replace(/LTS.*/, '')
    .value();

}

function extractOS(operatingSystem) {
  var osLowerCase = _.toLower(operatingSystem);
  return _.replace(osLowerCase, /\s/g, '_');
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
  var operatingSystem = extractOperatingSystem(vpcInstance);
  var os = extractOS(operatingSystem);

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
