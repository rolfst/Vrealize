'use strict';

var _ = require('lodash');

var requiredEntries = [
  'MachineGuestOperatingSystem', 'MachineMemory', 'MachineStorage', 'MachineCPU'
];

function toCompactPayload(vpcPayload) {
  var entries = _.filter(vpcPayload.resourceData.entries, function (entry) {
    return _.includes(requiredEntries, entry.key);
  });
  return {
    id: vpcPayload.id,
    name: vpcPayload.name,
    requiredEntries: {
      entries: entries
    }
  };
}

module.exports = toCompactPayload;
