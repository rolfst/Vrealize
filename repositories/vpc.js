'use strict';

var proxy = require('./proxy/vpc');


//function toModel(vpc) {
//  vpc.id = vpc._id;
//  return model(vpc);
//}

function listAsync(filter, pagination, callback) {
  return proxy.getComputeInstanceList().then(function () {
    return false;
  }).asCallback(callback);
}


var repo = {
  listAsync: listAsync
};

module.exports = repo;
