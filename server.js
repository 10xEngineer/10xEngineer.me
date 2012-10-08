var fs = require('fs');

var async = require('async');
var redis = require("redis");
var winston = require('winston');
var up = require('up');
var uphook = require('up-hook');

// Configure logs
var consoleTransport = new (winston.transports.Console)({ colorize: true, timestamp: true });
var log = new (winston.Logger)({ transports: [ consoleTransport ] });
var config = require('./app/config/config');

process.on('uncaughtException', function(err) {
  log.error("Unknown Error: ", err.toString());
  throw err;
});

// Remove pid file when exiting
process.on('exit', function() {
  log.info('Exiting...');
  fs.unlinkSync(config.get('site:pidfile'));
});
process.on('SIGINT', function() {
  process.exit(0);
});
process.on('SIGTERM', function() {
  process.exit(0);
});
process.on('SIGHUP', function() {
  process.exit(0);
});

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

  // Start the application
  function(callback) {
    var master = require('http').Server().listen(config.get('site:port'));

    var options = {
      numWorkers: 1, // TODO: Keep single worker for now to avoid proxy errors
      assumeReady: false,
      keepAlive: true,
      title: '10xEngineer'
    };
    // Initialize up
    var server = up(master, __dirname + '/app', options);
    
    server.use(uphook('/3a3d7d08-fccd-445a-acbb-cddb339f49d8', { branch: 'master', cmd: "make deploy" }));

    // Write a pid file
    fs.writeFile(config.get('site:pidfile'), process.pid, callback);

    // Listen for reload signal
    process.on('SIGUSR2', function () {
      server.reload();
    });

    var env = process.env.NODE_ENV || 'development';
    log.info("Server listening on port " + master.address().port + " in " + env + " mode");
  }
],
function(error) {
  if(error) {
    throw error;
  }
});

