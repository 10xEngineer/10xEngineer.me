var express = require('express');
var stylus = require('stylus');
var sharejs = require('share');
var RedisStore = require('connect-redis')(express);

var auth = require('./app/middleware/authentication');

module.exports = function(config) {
  var appRoot = process.cwd();
  var tmpFileUploadDir = appRoot + '/app/upload';
  var sessionStore = new RedisStore();

  // Authentication Middleware
  var authMiddleware = auth.getMiddleware(config);

  var app = express.createServer();

  // Express Middleware config
  app.configure(function(){
    // Views
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'jade');

    // CSS Preprocessing with stylus
    app.use(stylus.middleware({ src: __dirname + '/public' }));
    
    // Set app-level config in express
    app.set('appRoot', appRoot);
    app.set('tmpDir', tmpFileUploadDir);
    app.set('config', config);

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
    app.use(require('./app/middleware/errorHandler')({}));
  });

  // Routes
  require('./app/routes')(app);

  var sharejsOptions = {
    db: { type: 'redis' },
    auth: function(client, action) {
      // Reject readonly requests
      if (action.name === 'submit op' && action.docName.match(/^readonly/)) {
        action.reject();
      } else {
        action.accept();
      }
    }
  };

  sharejs.server.attach(app, sharejsOptions);

  return app;
};
