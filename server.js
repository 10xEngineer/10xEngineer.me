var express = require('express');
var mongoose = require('mongoose');
var RedisStore = require('connect-redis')(express);
var sessionStore = new RedisStore();

var log4js = require('log4js');
log = log4js.getLogger('app');

_ = require('underscore');

appRoot = process.cwd();

// Module loader
load = require(appRoot + '/app/loader')(appRoot);

// Prototype Utilities (TODO: Use underscore instead?)
require('./app/utils/prototypeUtils');

// Read configuration
var config = load.helper('config');

// ----------------
// Redis
// ----------------

var redis = require("redis");
var client = redis.createClient();

client.on("error", function (err) {
    log.error("[Redis] " + err);
});

// ----------------
// MongoDB Config
// ----------------
// Intitialize
mongoose.connect(config.db.address + config.db.database);

mongoose.connection.on('open', function() {
  log.info('Database connection established.');
});

log.info('Initializing models');
// Register models
load.model_init('count');
load.model_init('metadata');
load.model_init('role');
load.model_init('user');

// Migrate database schema
// TODO: Find a way to wait before this finishes executing
load.helper('dbMigrator')();


// Authentication Middleware
var authMiddleware = load.helper('auth')();

// ----------------
// Express
// ----------------

var app = module.exports = express.createServer();

// Express Middleware config
app.configure(function(){
  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser({uploadDir: __dirname + '/upload', keepExtensions: true }));
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    store: sessionStore,
    secret: 'shhhhhh',
    key: 'my.sid',
    cookie: {maxAge: 31557600000 }
  }));

  app.use(authMiddleware.middleware());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

// Configure Locals
app.use(function(req, res){
  // expose "error" and "message" to all
  // views that are rendered.
  res.locals.error = req.session.error || '';
  res.locals.message = req.session.message || '';
  // remove them so they're not displayed on subsequent renders
  delete req.session.error;
  delete req.session.message;
});

// Everyauth view helper
authMiddleware.helpExpress(app);

// Express environment config
var errorOptions = { dumpExceptions: true, showStack: true }
app.configure('development', function(){
  app.use(log4js.connectLogger(log, { level: log4js.levels.INFO }));
  log.setLevel('TRACE');
});

app.configure('production', function(){
  log4js.addAppender(log4js.fileAppender('app.log'), 'app');
  log.setLevel('INFO');
  errorOptions = {};
});

// Attach custom error handler middleware
app.use(load.middleware('errorHandler')(errorOptions));


// Custom middleware
requireLogin = function (req, res, next) {
  if(!req.loggedIn) {
    log.debug('User not logged in, redirecting to /auth.');
    res.redirect('/auth');
  }
}

requireAdmin = function (req, res, next) {
  // TODO: Implement with backend integration
  if(req.loggedIn) req.user.role = 'admin';

  if(!req.loggedIn || !req.user.role === 'admin') {
    log.debug('User not logged in, redirecting to /auth.');
    res.redirect('/auth');
  }
}


// Routes
load.routes()(app);


// Startup
app.listen(config.site.port);
log.info("Minvy server listening on port %d in %s mode", app.address().port, app.settings.env);

// Sample code to test database connection
// TODO: Remove it when not needed
var Count = load.model('Count');
Count.getNext('saves', function(error, count) {
  if (error) {
    log.warn('Could not determine count');
  }
  log.info('Run ' + count + ' times.');
});

