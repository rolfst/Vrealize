'use strict';
var mongoose = require('../mongoose');
var mongooseSchema = mongoose.Schema;

var schema = mongooseSchema({
  tenant: { type: String, required: true, index: { unique: true }}, // identifier to get token
  expiry: { type: String, required: true }, // expiry time from token
  token: { type: String, required: true, default: null }, // token
  createdAt: { type: Date, default: Date.now, expires: '8h' }
});

var Model = mongoose.model('Token', schema, 'tokens');

module.exports = Model;
