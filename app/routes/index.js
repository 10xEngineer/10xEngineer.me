var main = load.controller('main');
var admin = load.controller('admin');
var ability = load.helper('ability');


// ---------------------
// Middleware
// ---------------------


var validUser = function(req, res, next) { 
  if(req.user == undefined && req.url != '/'){
    req.session.redirectTo = req.url;
    res.redirect('/auth');
    return;
  }
  
  next();
}


module.exports = function(app) {

  // Interceptors
  app.all('/*', function(req, res, next) {
    
    if(req.loggedIn) {
      res.local('isAdmin', _.include(req.user.roles, 'admin'));
    } else {
      res.local('isAdmin', false);
    }

    next();
  });

  //filter for checking if the users have login
  //app.all('/pages/:op?/*', validUser, function(req, res, next){
  //  next();
  //});


  // Load Express data middleware
  load.middleware('data')(app);


  // Routes

  // Miscellaneous
  app.get('/', main.home);
  app.get('/about', main.about);
  app.get('/auth', main.auth);
  // Note: All the actual authentication routes are handled by auth middleware (everyauth). Refer Auth helper for more.


  // Page
/*  app.get('/pages', page.list);

  app.get('/page/create', page.createView);
  app.post('/page/create', page.create);
  app.get('/page/import', page.importView);
  app.post('/page/import', page.import);

  app.get('/page/:pageId', validCoursePermission('page', 'read'), page.show);
  app.get('/page/:pageId/edit', validCoursePermission('page', 'edit'), page.updateView);
  app.put('/page/:pageId', validCoursePermission('page', 'edit'), page.update);
  app.get('/page/:pageId/remove', validCoursePermission('page', 'delete'), page.remove);
*/
  // Admin
  app.get('/admin', admin.show);
  // TODO: Temporary admin path to make a user admin
  app.get('/admin/:userId/:roleId', admin.assignRole);



  // Handles 404 errors. This should be the last route.
  app.get('/*', function(req, res, next) {
    log.info('404');
    next(new Error('Not Found: ' + req.url));
    //throw new load.middleware('errorHandler').NotFound('Page not found');
  });


  // Middleware

  // Convert a parameter to integer
  app.param(['pageId', 'pageId', 'userId'], function(req, res, next, num, name){ 
    req.params[name] = num = parseInt(num, 10);
    if( isNaN(num) ){
      next(new Error('failed to parseInt ' + num));
    } else {
      next();
    }
  });
}