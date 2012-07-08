
exports = module.exports = function errorHandler(options) {
  options = options || {};

  // defaults
  var showStack = options.showStack || options.stack
  , showMessage = options.showMessage || options.message
  , dumpExceptions = options.dumpExceptions || options.dump
  , formatUrl = options.formatUrl;

  return function errorHandler(err, req, res, next) {
    res.statusCode = 500;
    if(dumpExceptions) { 
      log.error(err);
    }

    req.session.error = err;
    var app = res.app;

    if(err.message && err.message === '404') {
      res.render('errors/404', {
        locals: {
          title: '404 - Not Found',
          error: '404: The page you are trying to access doesn\'t exist'
        },
        status: 404
      });
    } else {
      res.render('errors/500', {
        locals: {
          title: 'The Server Encountered an Error',
          error: showStack ? err : undefined
        },
        status: 500
      });
    }
  };
};
