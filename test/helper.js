'use strict';

var sinon = require('sinon');  //eslint-disable-line no-unused-vars
var Promise = require('bluebird');
var sinonAsPromised = require('sinon-as-promised')(Promise);  //eslint-disable-line no-unused-vars
var chai = require('chai');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require('chai-as-promised');  //eslint-disable-line no-unused-vars

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

