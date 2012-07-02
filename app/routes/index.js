var main = load.controller('main');
var course = load.controller('course');
var course_editor = load.controller('course_editor');
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

var verifyPermission = function(entity, action){
  return function(req, res, next){
    var target = req[entity] ? req[entity].id : null;
    if(req.loggedIn && ability.can(req.user.roles, entity, target, action)){
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
  app.get('/courses', verifyPermission('course', 'read'), course.list);
/*
  app.get('/course/create', verifyPermission('course', 'edit'), course.createView);
  app.post('/course/create', verifyPermission('course', 'edit'), validation.lookUp(validationConfig.course.createCourse), course.create);
  app.get('/course/import', verifyPermission('course', 'edit'), course.importView);
  app.post('/course/import', verifyPermission('course', 'edit'), course.import);
*/
  app.get('/course/:courseId/start', verifyPermission('course', 'read'), course.start);
  app.get('/course/:courseId', verifyPermission('course', 'read'), course.show);
 /*
  app.get('/course/:courseId/edit', verifyPermission('course', 'edit'), course.updateView);
  app.post('/course/:courseId/edit', verifyPermission('course', 'edit'), validation.lookUp(validationConfig.course.editCourse), course.update);
  app.get('/course/:courseId/remove', verifyPermission('course', 'delete'), course.remove);
  app.get('/course/:courseId/publish', course.publish);
  app.get('/course/:courseId/unpublish', course.unpublish);
*/
  // Course Editor

  // Course oprations
  app.get('/course_editor', course_editor.coursesList);
  app.get('/course_editor/create', course_editor.createView);
  app.post('/course_editor/create', course_editor.create);
  app.get('/course_editor/import', course_editor.importView);
  app.post('/course_editor/import',course_editor.import);
  app.get('/course_editor/course/:courseId', course_editor.course);
  app.get('/course_editor/course/:courseId/edit', course_editor.updateView);
  app.post('/course_editor/course/:courseId/edit', course_editor.update);
  app.get('/course_editor/course/:courseId/remove', course_editor.remove);
  app.get('/course_editor/course/:courseId/publish', course_editor.publish);
  app.get('/course_editor/course/:courseId/unpublish', course_editor.unpublish);
  // Chapter oprations 
  app.get('/course_editor/chapter/create/:courseId', verifyPermission('chapter', 'edit'), course_editor.chapterCreateView);
  app.post('/course_editor/chapter/create/:courseId', verifyPermission('chapter', 'edit'), validation.lookUp(validationConfig.chapter.createChapter), course_editor.chapterCreate);
  app.get('/course_editor/chapter/:chapterId', course_editor.chapterView);
  app.get('/course_editor/chapter/:chapterId/edit', verifyPermission('chapter', 'edit'), course_editor.chapterEditView);
  app.post('/course_editor/chapter/:chapterId/edit', verifyPermission('chapter', 'edit'), validation.lookUp(validationConfig.chapter.editChapter), course_editor.chapterEdit);
  app.get('/course_editor/chapter/:chapterId/remove', verifyPermission('chapter', 'delete'), course_editor.chapterRemove);
  app.get('/course_editor/chapter/:chapterId/publish', verifyPermission('chapter', 'publish'), course_editor.chapterPublish);
  app.get('/course_editor/chapter/:chapterId/unpublish', verifyPermission('chapter', 'publish'), course_editor.chapterUnpublish);
  app.get('/course_editor/chapter/:chapterId/up', verifyPermission('chapter', 'edit'), course_editor.chapterUp);
  app.get('/course_editor/chapter/:chapterId/down', verifyPermission('chapter', 'edit'), course_editor.chapterDown);
  // Lesson operations
  app.get('/course_editor/lesson/create/:chapterId', verifyPermission('lesson', 'edit'), course_editor.lessonCreateView);
  app.post('/course_editor/lesson/create/:chapterId', verifyPermission('lesson', 'edit'), validation.lookUp(validationConfig.lesson.createLesson), course_editor.lessonCreate);
  app.get('/course_editor/lesson/:lessonId/edit',course_editor.lessonEditView);
  app.post('/course_editor/lesson/:lessonId/edit',course_editor.lessonEdit);
  app.get('/course_editor/lesson/:lessonId/remove', verifyPermission('lesson', 'delete'), course_editor.lessonRemove);
  app.get('/course_editor/lesson/:lessonId/up', verifyPermission('lesson', 'edit'), course_editor.lessonUp);
  app.get('/course_editor/lesson/:lessonId/down', verifyPermission('lesson', 'edit'), course_editor.lessonDown);
  app.get('/course_editor/lesson/:lessonId/publish',verifyPermission('lesson', 'publish'), course_editor.lessonPublish);
  app.get('/course_editor/lesson/:lessonId/unpublish', verifyPermission('lesson', 'publish'), course_editor.lessonUnpublish);
  app.get('/course_editor/lesson/:lessonId', verifyPermission('lesson', 'read'), course_editor.lessonView);


  // Chapter
 /*
  app.get('/chapter/create/:courseId', verifyPermission('chapter', 'edit'), chapter.createView);
  app.post('/chapter/create/:courseId', verifyPermission('chapter', 'edit'), validation.lookUp(validationConfig.chapter.createChapter), chapter.create);
*/
  app.get('/chapter/:chapterId',verifyPermission('chapter', 'read'), chapter.show);
/*
  app.get('/chapter/:chapterId/edit', verifyPermission('chapter', 'edit'), chapter.editView);
  app.post('/chapter/:chapterId/edit', verifyPermission('chapter', 'edit'), validation.lookUp(validationConfig.chapter.editChapter), chapter.edit);
  app.get('/chapter/:chapterId/remove', verifyPermission('chapter', 'delete'), chapter.remove);
  app.get('/chapter/:chapterId/publish', verifyPermission('chapter', 'publish'), chapter.publish);
  app.get('/chapter/:chapterId/unpublish', verifyPermission('chapter', 'publish'), chapter.unpublish);
  app.get('/chapter/:chapterId/up', verifyPermission('chapter', 'edit'), chapter.up);
  app.get('/chapter/:chapterId/down', verifyPermission('chapter', 'edit'), chapter.down);
*/

  // Lesson
/*
  app.get('/lesson/create/:chapterId', verifyPermission('lesson', 'edit'), lesson.createView);
  app.post('/lesson/create/:chapterId', verifyPermission('lesson', 'edit'), validation.lookUp(validationConfig.lesson.createLesson), lesson.create);
*/
  app.get('/lesson/:lessonId', verifyPermission('lesson', 'read'), lesson.showView);
  app.post('/lesson/:lessonId', verifyPermission('lesson', 'read'), lesson.show);
/*
  app.get('/lesson/:lessonId/edit',lesson.editView);
  app.post('/lesson/:lessonId/edit',lesson.edit);
  app.get('/lesson/:lessonId/remove', verifyPermission('lesson', 'delete'), lesson.remove);
  app.get('/lesson/:lessonId/up', verifyPermission('lesson', 'edit'), lesson.up);
  app.get('/lesson/:lessonId/down', verifyPermission('lesson', 'edit'), lesson.down);
  app.get('/lesson/:lessonId/publish',verifyPermission('lesson', 'publish'), lesson.publish);
  app.get('/lesson/:lessonId/unpublish', verifyPermission('lesson', 'publish'), lesson.unpublish);
*/
  app.get('/lesson/:lessonId/next', verifyPermission('lesson', 'read'),lesson.next);
  app.get('/lesson/:lessonId/previous', verifyPermission('lesson', 'read'), lesson.previous);
  app.get('/lesson/:lessonId/complete', verifyPermission('lesson', 'read'), lesson.complete);

  // CDN
  app.get('/cdn/:fileName', cdn.load);

  // User
  app.get('/user/profile', verifyPermission('user', 'read'), user.profile);
  app.get('/user/settings', verifyPermission('user', 'edit'), user.settingsView);
  app.post('/user/settings', verifyPermission('user', 'edit'), validation.lookUp(validationConfig.user.profileUpdate),user.settings);

  //app.get('/user/:userId', user.load);


  // Admin
  app.get('/admin', verifyPermission('admin', 'read'), admin.show);

  app.get('/admin/labs', admin.showLabsView);
  app.get('/admin/labs/create', admin.labsView);
  app.post('/admin/labs/create', admin.labs);
  app.get('/admin/labs/:labDefId/edit', admin.labEditView)
  app.post('/admin/labs/:labDefId/edit', admin.labEdit)
  app.get('/admin/labs/:labDefId/remove', admin.labRemove)

  app.get('/admin/roles', admin.rolesView);
  app.get('/admin/role/create', admin.createRoleView);
  app.post('/admin/role/create', admin.createRole);
  app.get('/admin/role/:roleId/edit', admin.editRoleView);
  app.post('/admin/role/:roleId/edit', admin.editRole);
  app.get('/admin/role/:roleId/remove', admin.removeRole);
  app.get('/admin/user/:userId/roles', admin.showUserRoles);
  app.post('/admin/user/:userId/roles', admin.updateUserRoles);
  app.get('/admin/user/:userId/:roleId', verifyPermission('admin', 'edit'), admin.assignRole);

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
