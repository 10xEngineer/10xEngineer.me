var http = require('http');

var KeyManager = require('./mc/keymanager').KeyManager;
var LabManager = require('./mc/labmanager').LabManager;

function Microcloud(endpoint) {
  this.endpoint = endpoint;
  this.keyManager = new KeyManager(endpoint);
  this.labManager = new LabManager(endpoint);
}

