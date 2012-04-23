var path = require('path');
var mongoose = require('mongoose');
var rootPath = path.join(process.cwd(), 'app');

module.exports = function(appRoot) {
  rootPath = path.join(appRoot, 'app');
  return Load;
};

var Load = function(type, name) {
  var args = Array.prototype.slice.call(arguments, 0);
  var type = args[0];
  if(type == 'model') {
    return loadModel(name);
  } else if(type == 'model_init') {
    return initModel(name);
  } else if(type == 'helper') {
    return loadHelper(name);
  } else if(type == 'controller') {
    return loadController(name);
  } else {
    log.error('Invalid type');
    process.exit(1);
  }
};

var initModel = Load.model_init = function(name) {
  var modelPath = rootPath + '/models';
  return require(path.join(modelPath, name));
};

var loadModel = Load.model = function(name) {
  return mongoose.model(name);
};

var loadHelper = Load.helper = function(name) {
  var helperPath = rootPath + '/helpers';
  return require(path.join(helperPath, name));
};

var loadController = Load.controller = function(name) {
  var controllerPath = rootPath + '/controllers';
  return require(path.join(controllerPath, name));
};
