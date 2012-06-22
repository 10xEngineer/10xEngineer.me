var main = load.controller('main');
var course = load.controller('course');
var chapter = load.controller('chapter');
var lesson = load.controller('lesson');
var quiz = load.controller('quiz');
var admin = load.controller('admin');
var user = load.controller('user');
var cdn = load.controller('cdn');
var validation = load.middleware('validation');
var ability = load.helper('ability');
var validationConfig = load.helper('validationConfig');


// ---------------------
// Middleware
// ---------------------


// IDEONE documentation http://ideone.com/files/ideone-api.pdf
var submitCode = function(code) {
  log.info('submitting code');
  request(
    { method: 'GET'
    , uri: wsdlurl
    , multipart: 
      [ { 'Content-type': 'application/json'
        ,  body: JSON.stringify({"jsonrpc": "2.0", "method": "getLanguages", "params": {"user": "velniukas", "pass": "limehouse"}, "id": 1})
        }
      ] 
    }
  , function (error, response, body) {
      if(response.statusCode == 201){
        log.info('test function called successfully: ' + error +', ' + moreHelp + ', ' + pi + ', ' + answerToLifeAndEverything + ', ' + oOok);
    return response.statusCode, response.body;
      } else {
        log.info('error: '+ response.statusCode)
        log.info(body);
    return response.statusCode, response.body;
      }
    }
  )
  
}

var validUser = function(req, res, next) { 
  if(req.user == undefined && req.url != '/courses'){
    req.session.redirectTo = req.url;
    res.redirect('/auth');
    return;
  }
  
  next();
}

var verifyPermition = function(entity, action){
  return function(req, res, next){
    log.info(req);
    if(req.loggedIn && ability.can(req.user.roles, entity, req[entity]._id, action)){
      next();
      return;
    }

    res.write('content is not accessible for your account.');
    res.end();
  }
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
  app.all('/courses/:op?/*', validUser, function(req, res, next){
    next();
  });

  app.all('/*', function(req, res, next){
    if(req.loggedIn && ( typeof(req.user.email) == 'undefined' || req.user.email == '') && req.path != '/user/settings') {
      res.redirect('/user/settings');
      return;
    }
    next();
  });


  // Load Express data middleware
  load.middleware('data')(app);


  // Routes

  // Miscellaneous
  app.get('/', main.home);
  app.get('/about', main.about);
  app.get('/auth', main.auth);
  // Note: All the actual authentication routes are handled by auth middleware (everyauth). Refer Auth helper for more.


  

  // Course
  app.get('/courses', verifyPermition('course', 'read'), course.list);

  app.get('/course/create', verifyPermition('course', 'edit'), course.createView);
  app.post('/course/create', verifyPermition('course', 'edit'), validation.lookUp(validationConfig.course.createCourse), course.create);
  app.get('/course/import', verifyPermition('course', 'edit'), course.importView);
  app.post('/course/import', verifyPermition('course', 'edit'), course.import);

  app.get('/course/:courseId/start', verifyPermition('course', 'read'), course.start);
  app.get('/course/:courseId', verifyPermition('course', 'read'), course.show);
  app.get('/course/:courseId/edit', verifyPermition('course', 'edit'), course.updateView);
  app.post('/course/:courseId/edit', verifyPermition('course', 'edit'), validation.lookUp(validationConfig.course.editCourse), course.update);
  app.get('/course/:courseId/remove', verifyPermition('course', 'delete'), course.remove);


  // Chapter
  app.get('/chapter/create/:courseId', verifyPermition('chapter', 'edit'), chapter.createView);
  app.post('/chapter/create/:courseId', verifyPermition('chapter', 'edit'), validation.lookUp(validationConfig.chapter.createChapter), chapter.create);
  app.get('/chapter/:chapterId',verifyPermition('chapter', 'read'), chapter.show);
  app.get('/chapter/:chapterId/edit', verifyPermition('chapter', 'edit'), chapter.editView);
  app.post('/chapter/:chapterId/edit', verifyPermition('chapter', 'edit'), validation.lookUp(validationConfig.chapter.editChapter), chapter.edit);
  app.get('/chapter/:chapterId/remove', verifyPermition('chapter', 'delete'), chapter.remove);
  app.get('/chapter/:chapterId/publish', verifyPermition('chapter', 'publish'), chapter.publish);
  app.get('/chapter/:chapterId/unpublish', verifyPermition('chapter', 'publish'), chapter.unpublish);
  app.get('/chapter/:chapterId/up', verifyPermition('chapter', 'edit'), chapter.up);
  app.get('/chapter/:chapterId/down', verifyPermition('chapter', 'edit'), chapter.down);


  // Lesson
  app.get('/lesson/create/:chapterId', verifyPermition('lesson', 'edit'), lesson.createView);
  app.post('/lesson/create/:chapterId', verifyPermition('lesson', 'edit'), validation.lookUp(validationConfig.lesson.createLesson), lesson.create);
  app.get('/lesson/:lessonId', verifyPermition('lesson', 'read'), lesson.showView);
  app.post('/lesson/:lessonId', verifyPermition('lesson', 'read'), lesson.show);
  app.get('/lesson/:lessonId/remove', verifyPermition('lesson', 'delete'), lesson.remove);
  app.get('/lesson/:lessonId/up', verifyPermition('lesson', 'edit'), lesson.up);
  app.get('/lesson/:lessonId/down', verifyPermition('lesson', 'edit'), lesson.down);
  app.get('/lesson/:lessonId/publish',verifyPermition('lesson', 'publish'), lesson.publish);
  app.get('/lesson/:lessonId/unpublish', verifyPermition('lesson', 'publish'), lesson.unpublish);
  app.get('/lesson/:lessonId/next', verifyPermition('lesson', 'read'),lesson.next);
  app.get('/lesson/:lessonId/previous', verifyPermition('lesson', 'read'), lesson.previous);
  app.get('/lesson/:lessonId/complete', verifyPermition('lesson', 'read'), lesson.complete);

  // CDN
  app.get('/cdn/:fileName', cdn.load);

  // User
  app.get('/user/profile', verifyPermition('user', 'read'), user.profile);
  app.get('/user/settings', verifyPermition('user', 'edit'), user.settingsView);
  app.post('/user/settings', verifyPermition('user', 'edit'), validation.lookUp(validationConfig.user.profileUpdate),user.settings);

  //app.get('/user/:userId', user.load);


  // Admin
  app.get('/admin', verifyPermition('admin', 'read'), admin.show);
  // TODO: Temporary admin path to make a user admin
  app.get('/admin/:userId/:roleId', verifyPermition('admin', 'edit'), admin.assignRole);




  // TODO: Organize
  app.post('/submitCode', function(req, res, next){
    log.info('in app.js::submitCode');
    var source = req.param('sourcecode', '');
    log.info('source=',source);
    var compile_res, compile_err = submitCode(source);
    log.info('re-rendering ide');
    res.render('ide', {
      title: 'submitCode',
      course: req.params.id,
      unit_id: req.params.unit,
      lesson_id: req.params.lesson,
      code: source, 
      compile_results: compile_res,
      compile_errors: compile_err,
      loggedInUser: req.user
    });

  });

  // Handles 404 errors. This should be the last route.
  /*app.get('/*', function(req, res, next) {
    log.info('404');
    next(new Error('Not Found: ' + req.url));
    //throw new load.middleware('errorHandler').NotFound('Page not found');
  });
*/

  // Middleware

  // Convert a parameter to integer
  app.param(['courseId', 'chapterId', 'lessonId', 'userId'], function(req, res, next, num, name){ 
    req.params[name] = num = parseInt(num, 10);
    if( isNaN(num) ){
      next(new Error('failed to parseInt ' + num));
    } else {
      next();
    }
  });
}