
var model = module.exports = function() {
  var models = {};
};

model.init = function(name, schema, options) {
  async.parallel([
    // Apply plugins
    function(callback) {
      if(options && options.plugins) {

        async.forEach(options.plugins, function(pluginName, callback) {
          var plugin = require('./plugins/' + pluginName);
          if(!plugin) {
            return callback(new Error('Invalid Plugin'));
          }

          schema.plugin(plugin);
          callback();
        }, callback);
      }
    },
    // Apply methods
    function(callback) {
      if(options && options.methods) {
        var methods = options.methods;
        var methodNames = _.keys(methods);

        async.forEach(methodNames, function(methodName, callback) {
          schema.methods[methodName] = methods[methodName];
        }, callback);
      }
    },
    // Apply statics
    function(callback) {
      if(options && options.statics) {
        var statics = options.statics;
        var staticNames = _.keys(statics);

        async.forEach(staticNames, function(staticName, callback) {
          schema.statics[staticName] = statics[staticName];
        }, callback);
      }
    }
  ],
  function(error) {
    if(error) {
      throw error;
    }
    
    // Register model
    mongoose.model(name, schema);
  });
};