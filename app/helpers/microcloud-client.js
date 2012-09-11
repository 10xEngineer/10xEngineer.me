var KeyManager = require('./mc/keymanager').KeyManager;
var LabManager = require('./mc/labmanager').LabManager;

module.exports = function Microcloud(endpoint) {
  // TODO: Hardcoded
  endpoint = endpoint || 'http://mc.apac.internal.10xlabs.net';

  return {
    keyManager: new KeyManager(endpoint),
    labManager: new LabManager(endpoint)
  };
};

