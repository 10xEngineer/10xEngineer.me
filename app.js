var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var winston = require('winston');
var RedisStore = require('connect-redis')(express);
var up = require('up');

// Initialize long stack-traces
require('longjohn');

// Configure logs
var consoleTransport = new (winston.transports.Console)({ colorize: true, timestamp: true });
var logger = new (winston.Logger)({ transports: [ consoleTransport ] });

global.log = logger;

module.exports = (function() {
  var auth = require('./app/middleware/authentication');
  var config = require('./app/config/config');
  var appRoot = process.cwd();
  var tmpFileUploadDir = appRoot + '/app/upload';
  var sessionStore = new RedisStore();

  // Authentication Middleware
  var authMiddleware = auth.getMiddleware(config);

  var app = express.createServer();

  // Custom parser to ignore parsing vfs requests
  var bodyParser = function(req, res, next) {
    var parser = express.bodyParser({uploadDir: tmpFileUploadDir, keepExtensions: true });
    if(req.url.indexOf('/fs') == 0) {
      var content = '', onData, onEnd;
      req.on('data', onData = function(data) {
        content += data;
      });
      req.on('end', onEnd = function() {
        req.removeListener('data', onData);
        req.removeListener('end', onEnd);
        req.content = content;
        next();
      })
    } else {
      parser(req, res, next);
    }
  };

  // Express Middleware config
  app.configure(function(){
    // Views
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });

    // CSS Preprocessing with stylus
    function compile(str, path) {
      return stylus(str)
        .set('filename', path)
        .set('compress', true)
        .use(nib())
        .import('nib');
    }
    app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
    
    // Set app-level config in express
    app.set('appRoot', appRoot);
    app.set('tmpDir', tmpFileUploadDir);
    app.set('config', config);

    // Body parser
    app.use(bodyParser);
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
    app.use(authMiddleware.initialize());
    app.use(authMiddleware.session());

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

    app.helpers({
      renderScriptTags: function (all) {
        if (all != undefined) {
          return all.map(function(script) {
            return '<script src="' + script + '"></script>';
          }).join('\n ');
        }
        else {
          return '';
        }
      },
      renderCssTags: function (all) {
        if (all != undefined) {
          return all.map(function(css) {
            return '<link href="' + css + '" rel="stylesheet" type="text/css" />';
          }).join('\n ');
        }
      }
    })
    app.dynamicHelpers({
      scripts: function(req, res){
        return [];
      },
      styles: function(req, res){
        return [];
      }
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
  app.configure('test', function(){
    app.use(require('./app/middleware/errorHandler')({ dumpExceptions: true, showStack: true }));
  });

  app.configure('development', function(){
    log.exitOnError = true;
    log.transports.console.level = 'silly';
    log.transports.console.prettyPrint = true;
    log.transports.console.handleExceptions = false;
    app.use(require('./app/middleware/errorHandler')({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    log.exitOnError = false;
    log.transports.console.level = 'silly';
    log.transports.console.prettyPrint = true;
    log.transports.console.handleExceptions = true;
    //`log.add(log.transports.File, { filename: 'app.log', level: 'info', handleExceptions: true, timestamp: true });
    app.use(require('./app/middleware/errorHandler')({ dumpExceptions: true }));
  });

  // Routes
  require('./app/routes')(app);

  // Initialize socket.io
  require('./socket')(app);

  // Initialize models
  require('./app/models')(config, function(error) {
    if(error) {
      throw error;
    }
    up.ready();
  })

  return app;
})();
