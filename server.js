var mongoose = require('mongoose');
var winston = require('winston');

// Configure logs
var consoleTransport = new (winston.transports.Console)({ colorize: true, timestamp: true, handleExceptions: true });
var logger = new (winston.Logger)({ transports: [ consoleTransport ], exitOnError: false });

console.log(JSON.stringify(logger));

global.log = logger;

var init = exports.init = function(config) {

  // ----------------
  // Redis
  // ----------------
  var redis = require("redis");
  var client = redis.createClient();

  client.on("error", function (err) {
      log.error("[Redis] " + err);
  });

  client.end();

  // ----------------
  // MongoDB Config
  // ----------------
  // Intitialize
  mongoose.connect(config.get('db:address') + config.get('db:database'));

  mongoose.connection.on('open', function() {
    log.info('Database connection established.');
  });

  log.info('Initializing models');
  // Register models
  require('./app/models')();

  // Migrate database schema
  // TODO: Find a way to wait before this finishes executing
  require('./app/helpers/dbMigrator')(config);


  // ----------------
  // Express
  // ----------------
  var app = require('./app')(config);
  var io = require('./socket')(app);

  return app;
};

// Run if not invoked by test suite
if(!module.parent) {
  var config = require('./app/config/config');
  var app = init(config);
  app.listen(config.get('site:port'));
  log.info("Server listening on port " + app.address().port + " in " + app.settings.env + " mode");


  // Sample code to test database connection
  // TODO: Remove it when not needed
  var Count = mongoose.model('Count');
  Count.getNext('saves', function(error, count) {
    if (error) {
      log.warn('Could not determine count');
    }
    log.info('Run ' + count + ' times.');
  });

}
