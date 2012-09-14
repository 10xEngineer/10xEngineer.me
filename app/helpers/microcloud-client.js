var KeyManager = require('./mc/keymanager').KeyManager;
var LabManager = require('./mc/labmanager').LabManager;
var Lab = require('./mc/labmanager').Lab;
var Compiler = require('./compiler-client').Compiler;

module.exports = function Microcloud(endpoint) {
  // TODO: Hardcoded
  endpoint = endpoint || 'http://mc.apac.internal.10xlabs.net';

  return {
    keyManager: new KeyManager(endpoint),
    labManager: new LabManager(endpoint),
    compiler: new Compiler(endpoint),
    Lab: Lab
  };
};

