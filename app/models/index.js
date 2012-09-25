var fs = require('fs');

var async = require('async');
var mongoose = require('mongoose');
var _ = require('lodash');

module.exports = exports = function(config, callback) {
  exports.models = {};

  exports.__proto__ = exports.models;

  var regExp = new RegExp('.model.js$');
  var files = fs.readdirSync('./app/models');

  async.waterfall([
    // Connect to the database
    function(callback) {

      log.info('Connecting to MongoDB.');
      mongoose.connect(config.get('db:address') + config.get('db:database'));

      mongoose.connection.on('open', function() {
        log.info('MongoDB connection established.');
        callback();
      });
      mongoose.connection.on('error', function(error) {
        log.error('Could not establish connection.');
        callback(error);
      });
    },

    // Require and cache the models
    function(callback) {
      // Initialize all the models
      async.forEach(files, function(modelFile, callback) {
        if(regExp.test(modelFile)) {
          var model = require('./' + modelFile);

          if(model.name) {
            exports.init(model.name, model.schema, model.options, callback);
          } else {
            callback(new Error(modelFile + ' is not a valid model.'));
          }
        } else {
          callback();
        }
      }, callback);
    }
  ], function(error) {
    log.info('Models initialized.');
    callback(error);
  });
};

module.exports.init = function(name, schema, options, callback) {
  var self = this;
  async.parallel([
    // Apply plugins
    function(callback) {
      if(options && options.plugins) {

        async.forEach(options.plugins, function(pluginName, callback) {
          var plugin = require('./plugins/' + pluginName);
          if(!plugin) {
            return callback(new Error('Invalid Plugin'));
          }

          if(pluginName == 'id') {
            schema.plugin(plugin(name));
          } else {
            schema.plugin(plugin);
          }
          
          callback();
        }, callback);
      } else {
        callback();
      }
    },
    // Apply methods
    function(callback) {
      if(options && options.methods) {
        var methods = options.methods;
        var methodNames = _.keys(methods);

        if(methodNames.length === 0) {
          return callback();
        }

        async.forEach(methodNames, function(methodName, callback) {
          schema.methods[methodName] = methods[methodName];
          callback();
        }, callback);
      } else {
        callback();
      }
    },
    // Apply statics
    function(callback) {
      if(options && options.statics) {
        var statics = options.statics;
        var staticNames = _.keys(statics);

        if(staticNames.length === 0) {
          return callback();
        }

        async.forEach(staticNames, function(staticName, callback) {
          schema.statics[staticName] = statics[staticName];
          callback();
        }, callback);
      } else {
        callback();
      }
    }
  ],
  function(error) {
    if(error) {
      callback(error);
    }

    // Register model
    mongoose.model(name, schema);

    // Cache the model in models object
    exports.models[name] = mongoose.model(name);

    callback();
  });
};
