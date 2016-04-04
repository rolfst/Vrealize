'use strict';

var _ = require('lodash');

var requiredEntries = [
  'MachineGuestOperatingSystem', 'MachineMemory', 'MachineStorage', 'MachineCPU'
];

function toCompactPayload(payload) {
  var entries = _.filter(payload.resourceData.entries, function (entry) {
    return _.includes(requiredEntries, entry.key);
  });
  return {
    id: payload.id,
    name: payload.name,
    resourceData: {
      entries: entries
    }
  };
}

module.exports = toCompactPayload;
