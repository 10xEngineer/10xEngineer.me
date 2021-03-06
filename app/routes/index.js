var _ = require('lodash');

var main = require('./main');
var course = require('./course');
var course_editor = require('./course_editor');
var quiz = require('./quiz');
var question = require('./question');
var lesson = require('./lesson');
var quiz = require('./quiz');
var admin = require('./admin');
var user = require('./user');
var cdn = require('./cdn');

var auth = require('../middleware/authentication');
var validation = require('../middleware/validation');
var courseSubscription = require('../middleware/courseSubscription');
var ability = require('../helpers/ability');
var validationConfig = require('../helpers/validationConfig');

// ---------------------
// Middleware
// ---------------------


var verifyPermission = function(entity, action){
  return function(req, res, next){
    var target = req[entity] ? req[entity].id : null;
    if(req.isAuthenticated()) {
      ability.can(req.user.roles, entity, target, action, function(can) {
        if(can) {
          next();
          return;          
        } else {
          res.redirect('/');
          res.write('content is not accessible for your account.');
          res.end();
        }
      });
    } else {
      res.redirect('/');
      res.write('content is not accessible for your account.');
      res.end();
    }
  };
};

var accessPermission = function(req, res, next) {
  if(req.isAuthenticated() && ( req.path == '/auth' )) {
    res.redirect('/');
  } else {
    next();
  }
};

var verifyCourseSubscription = function(req, res, next) {
  var course = req.lesson.chapter.course;
  var user   = req.user._id;
  if(typeof(course) == 'undefined' || typeof(user) == 'undefined') {
    res.redirect('/');
  } else {
    courseSubscription.verifyUser(course, user, function(err){
      if(err){
        console.error(err);
        res.redirect('/');
      }
      else {
        next();
      }
    })
  }
}

module.exports = function(app) {


  // Interceptors
  app.all('/*', function(req, res, next) {

    if(req.isAuthenticated()) {
      res.local('isLoggedIn', true);
      res.local('isAdmin', _.include(req.user.roles, 'admin'));
      res.local('user', req.user);
    } else {
      res.local('isLoggedIn', false);
      res.local('isAdmin', false);
    }

    next();
  });

  // Convert a parameter to integer
  app.param(['courseId', 'chapterId', 'lessonId', 'userId','questionIndex','assessmentId','questionId'], function(req, res, next, num, name){ 
    var parsedNum = parseInt(num, 10);
    if( isNaN(num) ){
      next(new Error('Invalid route: ' + num));
    } else {
      req.params[name] = parsedNum;
      next();
    }
  });

  // Load Express data middleware
  require('../middleware/data')(app);

  // vfs <-> mongo-vfs adapter
  require('../middleware/vfs')(app);

  // Routes

  // Miscellaneous
  app.get('/', main.home);
  app.get('/about', main.about);
  app.get('/tarball/:bucketId', main.tarball);

  // User
  app.get('/auth', accessPermission, user.login);
  app.post('/auth', accessPermission, auth.local);
  app.get('/auth/forgot_password', user.forgotPassword);
  app.get('/passwordRecover', user.resetPasswordView);
  app.post('/passwordRecover', user.resetPassword);
  app.post('/auth/forgot_password', user.mailLinkForResetPassword);
  app.get('/logout', auth.logout);

  app.get('/auth/twitter', auth.twitter);
  app.get('/auth/twitter/callback', auth.twitterCallback);
  app.get('/auth/google', auth.google);
  app.get('/auth/google/callback', auth.googleCallback);
  app.get('/auth/fb', auth.facebook);
  app.get('/auth/fb/callback', auth.facebookCallback);

  app.get('/register', accessPermission, user.registerView);
  app.post('/register', accessPermission, validation.lookUp(validationConfig.user.profileUpdate), user.register, auth.local);
  app.get('/user/profile', verifyPermission('user', 'read'), user.profile);
  app.get('/user/settings', verifyPermission('user', 'edit'), user.settingsView);
  app.post('/user/settings', verifyPermission('user', 'edit'), validation.lookUp(validationConfig.user.profileUpdate), user.settings);
  
  // Course
  app.get('/courses', verifyPermission('course', 'read'), course.featuredList);
  app.get('/courses/all', verifyPermission('course', 'read'), course.allList);

  app.get('/course/:courseId', verifyPermission('course', 'read'), course.show);
  app.get('/course/:courseId/start', verifyPermission('course', 'read'), course.start);
  app.get('/course/:courseId/continue', verifyPermission('course', 'read'), course.start);

  // Course Editor

  // Course oprations
  app.get('/course_editor', verifyPermission('course', 'read'), course_editor.coursesList);
  app.get('/course_editor/create', verifyPermission('course', 'edit'), course_editor.createView);
  app.post('/course_editor/create', verifyPermission('course', 'edit'),  validation.lookUp(validationConfig.course.createCourse), course_editor.create);
  app.get('/course_editor/import',  verifyPermission('course', 'edit'), course_editor.importView);
  app.post('/course_editor/import',  verifyPermission('course', 'edit'), course_editor.importCourse);
  app.get('/course_editor/course/:courseId', verifyPermission('course', 'read'), course_editor.course);
  app.get('/course_editor/course/:courseId/edit', verifyPermission('course', 'edit'), course_editor.updateView);
  app.get('/course_editor/course/:courseId/export', verifyPermission('course', 'edit'), course_editor.exportCourse);
  app.post('/course_editor/course/:courseId/edit', verifyPermission('course', 'edit'),  validation.lookUp(validationConfig.course.editCourse), course_editor.update);
  app.get('/course_editor/course/:courseId/remove', verifyPermission('course', 'delete'), course_editor.remove);
  app.get('/course_editor/course/:courseId/publish', verifyPermission('course', 'publish'), course_editor.publish);
  app.get('/course_editor/course/:courseId/unpublish', verifyPermission('course', 'publish'), course_editor.unpublish);
  app.get('/course_editor/course/:courseId/featured', verifyPermission('course', 'publish'), course_editor.featured);
  app.get('/course_editor/course/:courseId/unfeatured', verifyPermission('course', 'publish'), course_editor.unfeatured);
  // Chapter oprations 
  app.get('/course_editor/chapter/create/:courseId', verifyPermission('course', 'edit'), course_editor.chapterCreateView);
  app.post('/course_editor/chapter/create/:courseId', verifyPermission('course', 'edit'), validation.lookUp(validationConfig.chapter.createChapter), course_editor.chapterCreate);
  app.get('/course_editor/chapter/:chapterId', verifyPermission('course', 'read'), course_editor.chapterView);
  app.get('/course_editor/chapter/:chapterId/edit', verifyPermission('course', 'edit'), course_editor.chapterEditView);
  app.post('/course_editor/chapter/:chapterId/edit', verifyPermission('course', 'edit'), validation.lookUp(validationConfig.chapter.editChapter), course_editor.chapterEdit);
  app.get('/course_editor/chapter/:chapterId/remove', verifyPermission('course', 'delete'), course_editor.chapterRemove);
  app.get('/course_editor/chapter/:chapterId/publish', verifyPermission('course', 'publish'), course_editor.chapterPublish);
  app.get('/course_editor/chapter/:chapterId/unpublish', verifyPermission('course', 'publish'), course_editor.chapterUnpublish);
  app.get('/course_editor/chapter/:chapterId/up', verifyPermission('course', 'edit'), course_editor.chapterUp);
  app.get('/course_editor/chapter/:chapterId/down', verifyPermission('course', 'edit'), course_editor.chapterDown);
  // Lesson operations
  app.get('/course_editor/lesson/create/:chapterId', verifyPermission('course', 'edit'), course_editor.lessonCreateView);
  app.post('/course_editor/lesson/create/:chapterId', verifyPermission('course', 'edit'), validation.lookUp(validationConfig.lesson.createLesson), course_editor.lessonCreate);
  app.get('/course_editor/lesson/:lessonId/edit', verifyPermission('course', 'edit'), course_editor.lessonEditView);
  app.post('/course_editor/lesson/:lessonId/edit', verifyPermission('course', 'edit'), validation.lookUp(validationConfig.lesson.createLesson), course_editor.lessonEdit);
  app.get('/course_editor/lesson/:lessonId/remove', verifyPermission('course', 'delete'), course_editor.lessonRemove);
  app.get('/course_editor/lesson/:lessonId/up', verifyPermission('course', 'edit'), course_editor.lessonUp);
  app.get('/course_editor/lesson/:lessonId/down', verifyPermission('course', 'edit'), course_editor.lessonDown);
  app.get('/course_editor/lesson/:lessonId/publish',verifyPermission('course', 'publish'), course_editor.lessonPublish);
  app.get('/course_editor/lesson/:lessonId/unpublish', verifyPermission('course', 'publish'), course_editor.lessonUnpublish);
  app.get('/course_editor/lesson/:lessonId', verifyPermission('course', 'read'), course_editor.lessonView);

  // Lesson
  // TODO: Refactor
  app.get('/lesson/serverInfo', lesson.serverInfo);

  app.get('/lesson/:lessonId', verifyPermission('course', 'read'), verifyCourseSubscription, lesson.showView);
  //app.post('/lesson/:lessonId', verifyPermission('course', 'read'), lesson.show);
  app.get('/lesson/:lessonId/next', verifyPermission('course', 'read'), verifyCourseSubscription,lesson.next);
  app.get('/lesson/:lessonId/previous', verifyPermission('course', 'read'), verifyCourseSubscription, lesson.previous);
  app.get('/lesson/:lessonId/complete', verifyPermission('course', 'read'), verifyCourseSubscription, lesson.complete);
  app.get('/lesson/:lessonId/updateProgress', lesson.updateProgress);

  // CDN
  app.get('/cdn/:fileName', cdn.load);

  // Admin
  app.get('/admin', verifyPermission('admin', 'read'), admin.show);
  app.get('/admin/approve', verifyPermission('admin', 'edit'), admin.approveView);
  app.get('/admin/approve/:userId', verifyPermission('admin', 'edit'), admin.approve);

  app.get('/admin/labs', verifyPermission('admin', 'read'), admin.showLabsView);
  app.get('/admin/labs/create', verifyPermission('admin', 'edit'), admin.labsView);
  app.post('/admin/labs/create', verifyPermission('admin', 'edit'), admin.labs);
  app.get('/admin/labs/:labDefId/edit', verifyPermission('admin', 'edit'), admin.labEditView);
  app.post('/admin/labs/:labDefId/edit', verifyPermission('admin', 'edit'), admin.labEdit);
  app.get('/admin/labs/:labDefId/remove', verifyPermission('admin', 'delete'), admin.labRemove);

  app.get('/admin/roles', verifyPermission('admin', 'read'), admin.rolesView);
  app.get('/admin/role/create', verifyPermission('admin', 'edit'), admin.createRoleView);
  app.post('/admin/role/create', verifyPermission('admin', 'edit'), admin.createRole);
  app.get('/admin/role/:roleId/edit', verifyPermission('admin', 'edit'), admin.editRoleView);
  app.post('/admin/role/:roleId/edit', verifyPermission('admin', 'edit'), admin.editRole);
  app.get('/admin/role/:roleId/remove', verifyPermission('admin', 'delete'), admin.removeRole);
  app.get('/admin/role/:roleName', verifyPermission('admin', 'edit'), admin.usersRoleView);
  
  app.get('/admin/usersImport', verifyPermission('admin', 'edit'), admin.usersImportView);
  app.post('/admin/usersImport', verifyPermission('admin', 'edit'), admin.usersImport);
  app.get('/admin/user/:userId/roles', verifyPermission('admin', 'read'), admin.showUserRoles);
  app.post('/admin/user/:userId/roles', verifyPermission('admin', 'edit'), admin.updateUserRoles);
  app.get('/admin/user/:userId/remove', verifyPermission('admin', 'delete'), admin.removeUser);
  app.get('/admin/user/:userId/info', verifyPermission('admin', 'edit'), admin.userInfo);
  app.get('/admin/user/:userId/:roleId', verifyPermission('admin', 'edit'), admin.assignRole);

  // Assessment
  app.get('/assessment/quiz', verifyPermission('admin', 'read'), main.assessment);

  // Quiz 
  app.get('/assessment/quiz', verifyPermission('admin', 'read'), quiz.quizList);
  app.get('/assessment/quiz/create', verifyPermission('admin', 'edit'), quiz.createView);
  app.post('/assessment/quiz/create', verifyPermission('admin', 'edit'), validation.lookUp(validationConfig.quiz.createQuiz), quiz.create);
  app.get('/assessment/quiz/examin', verifyPermission('assessment', 'edit'), quiz.examin);
  app.get('/assessment/quiz/examin/:assessmentId/start', verifyPermission('assessment', 'edit'), quiz.startExamin);
  app.get('/assessment/quiz/examin/:assessmentId/:questionIndex', verifyPermission('assessment', 'edit'), quiz.showQuestionToExaminer);
  app.post('/assessment/quiz/examin/:assessmentId/:questionIndex', verifyPermission('assessment', 'edit'), quiz.submitAssessmentMarks);
  app.get('/assessment/quiz/:lessonId', verifyPermission('admin', 'read'), quiz.view);
  app.get('/assessment/quiz/:lessonId/edit', verifyPermission('admin', 'edit'), quiz.editView);
  app.post('/assessment/quiz/:lessonId/edit', verifyPermission('admin', 'edit'), validation.lookUp(validationConfig.quiz.editQuiz), quiz.edit);
  app.get('/assessment/quiz/:lessonId/remove', verifyPermission('admin', 'delete'), quiz.removeQuiz);
  app.get('/assessment/quiz/:lessonId/start', verifyPermission('course', 'read'), verifyCourseSubscription, quiz.startQuiz);
  app.get('/assessment/quiz/:lessonId/continue', verifyPermission('course', 'read'), verifyCourseSubscription, quiz.continueQuiz);
  app.get('/assessment/quiz/:lessonId/finish', verifyPermission('course', 'read'), verifyCourseSubscription, quiz.quizResult);
  app.get('/assessment/quiz/:lessonId/:questionIndex', verifyPermission('course', 'read'), verifyCourseSubscription, quiz.viewQuestion);
  app.post('/assessment/quiz/:lessonId/:questionIndex', verifyPermission('course', 'read'), validation.lookUp(validationConfig.question.attemptQuestion), verifyCourseSubscription, quiz.submitQuestion);
  app.get('/assessment/question/create/:lessonId', verifyPermission('admin', 'edit'), question.createView);
  app.post('/assessment/question/create/:lessonId', verifyPermission('admin', 'edit'), validation.lookUp(validationConfig.question.createQuestion), question.create);
  app.get('/assessment/question/import/:lessonId', verifyPermission('admin', 'edit'), question.importQuestionView);
  app.post('/assessment/question/import/:lessonId', verifyPermission('admin', 'edit'), question.importQuestion);
  app.get('/assessment/question/:questionId/remove', verifyPermission('admin', 'edit'), question.removeQuestion);
  app.get('/assessment/question/:questionId/edit', verifyPermission('admin', 'edit'), question.editView);
  app.post('/assessment/question/:questionId/edit', verifyPermission('admin', 'edit'), validation.lookUp(validationConfig.question.createQuestion), question.edit);

};
