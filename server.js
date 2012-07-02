var express = require('express');
var mongoose = require('mongoose');
var RedisStore = require('connect-redis')(express);
var sessionStore = new RedisStore();

var log4js = require('log4js');

// Global variables
log = log4js.getLogger('app');
_ = require('underscore');
appRoot = process.cwd();
tmpFileUploadDir = appRoot + '/app/upload';

// Module loader
load = require(appRoot + '/app/loader')(appRoot);

var init = exports.init = function(config) {

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
  mongoose.connect(config.get('db:address') + config.get('db:database'));

  mongoose.connection.on('open', function() {
    log.info('Database connection established.');
  });

  log.info('Initializing models');
  // Register models
  require('./app/models')();

  // Migrate database schema
  // TODO: Find a way to wait before this finishes executing
  load.helper('dbMigrator')(config);

  // Authentication Middleware
  var authMiddleware = load.helper('auth')(config);

  // ----------------
  // Express
  // ----------------

  var app = module.exports = express.createServer();

  // Express Middleware config
  app.configure(function(){
    // Views
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'jade');

    // Body parser
    app.use(express.bodyParser({uploadDir: tmpFileUploadDir, keepExtensions: true }));
    app.use(express.methodOverride());

    // Cookies and session
    app.use(express.cookieParser());
    app.use(express.session({
      store: sessionStore,
      secret: 'shhhhhh',
      key: 'my.sid',
      cookie: {maxAge: 31557600000 }
    }));

    // Auth and routes
    app.use(authMiddleware.middleware());
    app.use(function(req, res, next){
      if(req.method === 'GET') {
        // expose "error" and "message" to all
        // views that are rendered.
        res.local('error', req.session.error || undefined);
        res.local('message', req.session.message || undefined);
        // remove them so they're not displayed on subsequent renders
        delete req.session.error;
        delete req.session.message;
      }
      next();
    });
    app.use(app.router);

    // Static files
    app.use(express.static(__dirname + '/public'));

    // 404 Handler
    app.use(function(req, res, next) {
      log.error('404: Not Found: ' + req.url);
      next(new Error('404'));
    });
  });

  // Express environment config
  app.configure('development', function(){
    app.use(log4js.connectLogger(log, { level: log4js.levels.INFO }));
    log.setLevel('TRACE');
    app.use(load.middleware('errorHandler')({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    log4js.addAppender(log4js.fileAppender('app.log'), 'app');
    log.setLevel('INFO');
    app.use(load.middleware('errorHandler')({}));
  });

  // Everyauth view helper
  authMiddleware.helpExpress(app);

  // Routes
  load.routes()(app);

  return app;
}

// Run if not invoked by test suite
if(!module.parent) {
  var config = require('./app/config/config');
  var app = init(config);
  app.listen(config.get('site:port'));
  log.info("Server listening on port %d in %s mode", app.address().port, app.settings.env);


  // Sample code to test database connection
  // TODO: Remove it when not needed
  var Count = load.model('Count');
  Count.getNext('saves', function(error, count) {
    if (error) {
      log.warn('Could not determine count');
    }
    log.info('Run ' + count + ' times.');
  });





  //socket for ideone source code execution
  var request = require('request');
  var parseCookie = require('connect').utils.parseCookie;
  var Session = require('connect').middleware.session.Session;
  var wsdlurl = 'http://ideone.com/api/1/service.json';
  var io = require('socket.io').listen(app);

  io.configure(function () {
    io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
    io.set('authorization', function(data, callback) {
      // check if there's a cookie header
      if (data.headers.cookie) {
          // if there is, parse the cookie
          //data.cookie = parseJSONCookies(parseCookie(data.headers.cookie));
          data.cookie = parseCookie(data.headers.cookie);
          // note that you will need to use the same key to grad the
          // session id, as you specified in the Express setup.
          data.sessionID = data.cookie['my.sid'];
          // save the session store to the data object 
          // (as required by the Session constructor)
          data.sessionStore = sessionStore;
          sessionStore.get(data.sessionID, function (err, session) {
            if (err) {
              callback(err, false);
            } else if(!session) {
              callback('Session not found');
            } else {
              // create a session object, passing data as request and our
              // just acquired session data
              data.session = new Session(data, session);
              callback(null, true);
            }
          });

      } else {
         // if there isn't, turn down the connection with a message
         // and leave the function.
         return callback('No cookie transmitted.', false);
      }
    });
  });

  io.configure('development', function () {
    io.set('transports', ['websocket', 'xhr-polling']);
    io.enable('log');
  });

  io
    .of('/code')
    .on('connection', function (socket) {
      socket.on('submitcode', function(data){
      log.info(data);
      request(
          { method: 'GET'
          , uri: wsdlurl
        , json: {
              jsonrpc: "2.0",
              method: "createSubmission", 
              params: 
              {
                user: "velniukas", 
                pass: "limehouse", 
                sourceCode: data.source,
                language: data.language, //javascript
                input:true, //this is a parameter bug of the ideone API, it supposes to be a run time input, instead of an indicator to run code
                run:true
              }, 
              "id": 1
            }
          }
        , function (error, response, body) {
          log.info(body);
              socket.volatile.emit('codesent', body);
          }
        )
    });
    
    socket.on('getSubmissionStatus', function(data){
      request(
          {
            method:'GET',
            uri: wsdlurl,
            json:{
              jsonrpc: "2.0",
              method: "getSubmissionStatus", 
              params: 
              {
                user: "velniukas", 
                pass: "limehouse",
                link: data.linkCode, 
              }, 
              "id": 1
            }
          },
          function(error, response, body){
            log.info(body);
            socket.volatile.emit('submissionStatus', body)           
          }
          )
    });
    
    socket.on('getSubmissionDetails', function(data){
      request(
        {
          method:'GET',
          uri: wsdlurl,
          json:{
            jsonrpc: "2.0",
            method: "getSubmissionDetails", 
            params: 
            {
              user: "10xengineer", 
              pass: "secret",
              link: data.linkCode, 
              withSource: true,
              withOutput: true,
              withCmpinfo: true,
              withStderr: true
            }, 
            "id": 1
          }
        },
        function(error, response, body){
          log.info(body);
          socket.volatile.emit('submissionDetails', body)           
        }
      )
    }); 
  });
}
