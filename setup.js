var fs = require('fs');
var path = require('path');
var async = require('async');
var winston = require('winston');
var mongoose = require('mongoose');
var consoleTransport = new (winston.transports.Console)({ colorize: true, timestamp: true });
var config = require('./app/config/config');
var logger = new (winston.Logger)({ transports: [ consoleTransport ] });

global.log = logger;

async.waterfall([
  // Initializing models
  function(callback){
    require('./app/models')(config, function(error) {
      if(error) {
          return callback(error);
      }
      callback();
    });
  },
  // Database migration
  function(callback) {
    log.info('Migrating database schema/data to the latest version (if required).');
    require('./app/helpers/dbMigrator')(config, function(error) {
      if(error) {
        return callback(error);
      }
      callback();
    });
  },
  // Verify app/upload directory
  function(callback) {
    var verify_path = path.resolve('./app/upload');
    fs.exists(verify_path, function(file_exist){
      if(!file_exist){
        return fs.mkdir(verify_path, 0777, callback);
      }
      callback();
    });
  }
], function(error){
  if(error) {
    console.log("Error :: "+error);
    throw error;
  }
  process.exit(0);
});