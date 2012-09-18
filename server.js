var async = require('async');
var mongoose = require('mongoose');
var winston = require('winston');
var redis = require("redis");

// Initialize long stack-traces
require('longjohn');

// Configure logs
var consoleTransport = new (winston.transports.Console)({ colorize: true, timestamp: true });
var logger = new (winston.Logger)({ transports: [ consoleTransport ] });

global.log = logger;

process.on('uncaughtException', function(err) {
  log.error("Unknown Error: ", err.toString());
  throw err;
});

var config = require('./app/config/config');

async.waterfall([

  // Test Redis connection
  function(callback) {
    log.info('Checking Redis connection...');
    var client = redis.createClient();

    client.on("error", function (error) {
      client.end();
      callback(error);
    });

    client.on("connect", function() {
      client.end();
      log.info('Redis...OK');
      callback();
    });
  },

  // Initialize MongoDB Connection
  function(callback) {
    log.info('Connecting to MongoDB.');
    mongoose.connect(config.get('db:address') + config.get('db:database'));

    mongoose.connection.on('open', function() {
      log.info('MongoDB connection established.');
      callback();
    });
  },

  // Initialize models
  function(callback) {
    log.info('Initializing and registering models...');
    require('./app/models')(function(error) {
      if(error) {
        return callback(error);
      }

      log.info('Models registered.');
      callback();
    });
  },

  // Migrating database schema and import data
  function(callback) {
    log.info('Migrating database schema/data to the latest version (if required).');
    require('./app/helpers/dbMigrator')(config, function(error) {
      if(error) {
        return callback(error);
      }

      callback();
    });
  },

  // Initialize Express and Socket.io apps
  function(callback) {
    var app = require('./app')(config);

    callback(null, app);
  },

  // Start the application
  function(app, callback) {
    app.listen(config.get('site:port'));
    log.info("Server listening on port " + app.address().port + " in " + app.settings.env + " mode");
  }
],
function(error) {
  if(error) {
    throw error;
  }

  // Sample code to test database connection
  // TODO: Remove it when not needed
  var model = require('./app/models');
  var Count = model.Count;
  Count.getNext('saves', function(error, count) {
    if (error) {
      log.warn('Could not determine count');
    }
    log.info('Run ' + count + ' times.');
  });
});

