var express = require('express');
var RedisStore = require('connect-redis')(express);
var log4js = require('log4js');

module.exports = function(config) {
  var appRoot = config.appRoot || process.cwd();
  var tmpFileUploadDir = appRoot + '/app/upload';
  var sessionStore = new RedisStore();

  // Authentication Middleware
  var authMiddleware = load.helper('auth')(config);

  var app = express.createServer();

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
};
