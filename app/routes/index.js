var main = load.controller('main');
var course = load.controller('course');
var quiz = load.controller('quiz');
var admin = load.controller('admin');

var ability = load.helper('ability');


// ---------------------
// Middleware
// ---------------------

var validateCourseData = function (req, callback) {
  errors = [];
  data = {};

  if (!req.body.title) {
    errors.push('Title required.');  
  }
  if (!req.body.description) {
    errors.push('Description required.');  
  }

  if (errors.length > 0) {
    callback(errors);
  } else {
    data.title = req.body.title;
    data.description = req.body.description;

    if(req.body.image) {
      data.image = req.body.image;
    }

    callback( null, data);
  }
};

// IDEONE documentation http://ideone.com/files/ideone-api.pdf
var submitCode = function(code) {
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

var validCoursePermission = function(entity, action){
  return function(req, res, next){
    if(req.loggedIn && ability.can(req.user.roles, entity, req.course.id, action)){
      log.info('here');
      next();
      return;
    }

    res.write('content is not accessible for your account.');
    res.end();
  }
}


module.exports = function(app) {

  // Load Express data middleware
  load.middleware('data')(app);

  // Miscellaneous
  app.get('/', main.home);
  app.get('/about', main.about);
  app.get('/auth', main.auth);
  // Note: All the actual authentication routes are handled by auth middleware (everyauth). Refer Auth helper for more.


  // Course
  app.get('/courses', course.list);

  app.get('/course/create', course.createView);
  app.post('/course/create', course.create);
  app.get('/course/import', course.importView);
  app.post('/course/import', course.import);

  app.get('/course/:courseId', validCoursePermission('course', 'read'), course.show);
  app.get('/course/:courseId/edit', validCoursePermission('course', 'edit'), course.updateView);
  app.put('/course/:courseId', validCoursePermission('course', 'edit'), course.update);
  app.delete('/course/:courseId', validCoursePermission('course', 'delete'), course.remove);


  // Quiz
  app.get('/quiz/edit', quiz.edit);
  app.post('/quiz/import', quiz.importJson);
  app.get('/quiz/:id/:unit/:lesson', quiz.view);
  app.post('/quiz/:id/:unit/:lesson', quiz.test);

  // Admin
  app.get('/admin', admin.show);



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
  app.get('/*', function(req, res) {
    throw new load.middleware('errorHandler').NotFound;
  });


  // Middleware

  //filter for checking if the users have login
  app.all('/courses/:op?/*', validUser, function(req, res, next){
    next();
  });

  // Convert a parameter to integer
  app.param(['courseId'], function(req, res, next, num, name){ 
    req.params[name] = num = parseInt(num, 10);
    if( isNaN(num) ){
      next(new Error('failed to parseInt ' + num));
    } else {
      next();
    }
  });
}