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


var validUser = function(req, res, next) { 
  if(req.user === undefined && req.url != '/courses'){
    req.session.redirectTo = req.url;
    res.redirect('/auth');
    return;
  }
  
  next();
};

var validCoursePermission = function(entity, action){
  return function(req, res, next){
    if(req.loggedIn && ability.can(req.user.roles, entity, req.course._id, action)){
      next();
      return;
    }

    res.write('content is not accessible for your account.');
    res.end();
  };
};


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
    if(req.loggedIn && ( typeof(req.user.email) == 'undefined' || req.user.email === '') && req.path != '/user/settings') {
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
  app.get('/courses', course.list);

  app.get('/course/create', course.createView);
  app.post('/course/create', validation.lookUp(validationConfig.course.createCourse), course.create);
  app.get('/course/import', course.importView);
  app.post('/course/import', course.import);

  app.get('/course/:courseId/start', validCoursePermission('course', 'read'), course.start);
  app.get('/course/:courseId', validCoursePermission('course', 'read'), course.show);
  app.get('/course/:courseId/edit', validCoursePermission('course', 'edit'), course.updateView);
  app.post('/course/:courseId/edit', validCoursePermission('course', 'edit'), validation.lookUp(validationConfig.course.editCourse), course.update);
  app.get('/course/:courseId/remove', validCoursePermission('course', 'delete'), course.remove);
  app.get('/course/:courseId/publish', course.publish);
  app.get('/course/:courseId/unpublish', course.unpublish);


  // Chapter
  app.get('/chapter/create/:courseId', chapter.createView);
  app.post('/chapter/create/:courseId', validation.lookUp(validationConfig.chapter.createChapter), chapter.create);
  app.get('/chapter/:chapterId', chapter.show);
  app.get('/chapter/:chapterId/edit', chapter.editView);
  app.post('/chapter/:chapterId/edit', validation.lookUp(validationConfig.chapter.editChapter), chapter.edit);
  app.get('/chapter/:chapterId/remove', chapter.remove);
  app.get('/chapter/:chapterId/publish', chapter.publish);
  app.get('/chapter/:chapterId/unpublish', chapter.unpublish);
  app.get('/chapter/:chapterId/remove', chapter.remove);
  app.get('/chapter/:chapterId/up',chapter.up);
  app.get('/chapter/:chapterId/down',chapter.down);


  // Lesson
  app.get('/lesson/create/:chapterId', lesson.createView);
  app.post('/lesson/create/:chapterId', validation.lookUp(validationConfig.lesson.createLesson), lesson.create);
  app.get('/lesson/:lessonId', lesson.showView);
  app.post('/lesson/:lessonId', lesson.show);
  app.get('/lesson/:lessonId/edit',lesson.editView);
  app.post('/lesson/:lessonId/edit',lesson.edit);
  app.get('/lesson/:lessonId/remove', lesson.remove);
  app.get('/lesson/:lessonId/up', lesson.up);
  app.get('/lesson/:lessonId/down', lesson.down);
  app.get('/lesson/:lessonId/publish', lesson.publish);
  app.get('/lesson/:lessonId/unpublish', lesson.unpublish);
  app.get('/lesson/:lessonId/next', lesson.next);
  app.get('/lesson/:lessonId/previous', lesson.previous);
  app.get('/lesson/:lessonId/complete', lesson.complete);

  // CDN
  app.get('/cdn/:fileName', cdn.load);

  // User
  app.get('/user/profile', user.profile);
  app.get('/user/settings', user.settingsView);
  app.post('/user/settings', validation.lookUp(validationConfig.user.profileUpdate), user.settings);

  //app.get('/user/:userId', user.load);


  // Admin
  app.get('/admin', admin.show);
  app.get('/admin/labs/create', admin.labsView);
  app.post('/admin/labs/create', admin.labs);
  app.get('/admin/labs/show', admin.showLabsView);
  app.get('/admin/labs/:labDefId/edit', admin.labEditView)
  app.post('/admin/labs/:labDefId/edit', admin.labEdit)
  app.get('/admin/labs/:labDefId/remove', admin.labRemove)
  // TODO: Temporary admin path to make a user admin
  app.get('/admin/:userId/:roleId', admin.assignRole);


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
};
