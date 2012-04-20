var request = require('request');
var fs = require('fs');
var path = require('path')

// Load models
var course = require('../models/course');
var user = require('../models/user');

// Load Helpers
var ability = require('../helpers/ability');


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

var loadCourse = function (req, res, next) {
  var id = parseInt(req.params.id);
  var chapter = parseInt(req.params.chapter);
  var lesson = parseInt(req.params.lesson);

  course.findById(id, function(error, course) {
    if (error || !course) {
      log.trace('Could not find course!');
    }
    req.course = course;
    var helper = {
      course: course 
    }
    
    try {
      if(typeof(chapter) != 'undefined') {
        chapter = parseInt(chapter);
        if(typeof(lesson) != 'undefined') {
          lesson = parseInt(lesson);
        } else {
          // Set default lesson value
          lesson = 0;
        }
      } else {
        // Set default unit value
        chapter = 0;
      }
    } catch (e) {
      log.error(e);
      next();
    }

    // Check if specified unit exists. If not, redirect to course home
    if(course && course.units && course.units[chapter-1]) {
      // Set the unit object in UI helper
      var chapterObj = req.chapter = helper['chapter'] = course.units[chapter-1];

      // Check if specified lesson exists. If not, redirect to unit home
      if(chapterObj.lessons && chapterObj.lessons[lesson-1]) {
        // Set the lesson object in UI helper
        req.lesson = helper['lesson'] = chapterObj.lessons[lesson-1];
      }
    }

    req.app.helpers(helper);
    next();
  });
}


var validUser = function(req, res, next) { 
	if(req.user == undefined && req.url != '/courses'){
		req.session.redirectTo = req.url;
		res.redirect('/auth');
		return;
	}
	
	next();
}

var validCoursePermission = function(target, action){
	return function(req, res, next){
		if(!ability.can(req.user.abilities, action, target, req.params.id)){
			res.write('content is not accessible for your account.');
			res.end();
			return;
		}
		next();
	}
}

// ------------
// Routes
// ------------
module.exports = function (app) {
  //filter for checking if the users have login
  app.all('/courses/:op?/*', validUser, function(req, res, next){
		next();
  });

  // List existing courses
  app.get('/courses', function(req, res){
    var registered_courses = [];
    if( typeof(req.user) != 'undefined' && typeof(req.user.registered_courses) != 'undefined') {
      registered_courses = req.user.registered_courses;
    }

    log.info('user = ', req.user);
    log.info('registered courses = ', registered_courses);
    course.get({}, function(error, courses){
      res.render('courses', { 
        title: 'Courses',
        courses: courses,
        registered_courses: registered_courses
      });
    });
  });

  // Create new course form
  app.get('/courses/create', function(req, res){
    res.render('courses/create', {
      title: 'New Course',
      course: {_id:'',title:'',description:''},
    });
  });

  // Create a new course
  app.post('/courses/create', function(req, res){
    validateCourseData(req, function (error, data){
      if (error) {
        log.error(error);
        res.redirect('/course/create/?' + error);
      } else {
        if (!data.created_by) {
          data.created_by = req.user.id;
        }
        course.createNew( data, function( error, course) {
          id = course._id;

          //Set the course info in the session to let socket.io know about it.
          req.session.newCourse = {title: course.title, _id: id};
          res.redirect('/courses/' + id);
        });
      }
    });
  });

  // TODO: Quick course import tool. Modify to support the new course format
  app.get('/courses/import', function(req, res){
    res.render('content_manager', {
      title: '10xEngineer.me Course Creator',
      description: 'Create courses with its units from JSON file.',
      contentfile: req.param('coursefile', ''),
      success: req.params.success || false
    });
  });

  // Temporary course import using json file upload
  app.post('/courses/import', function(req, res, next) {

    log.info('Uploading file', req.body); // form is there but not accessible
    var f = req.files['course-file'];
    log.info('Uploaded %s to %s', f.filename, f.path);
    log.info('copying file from temp upload dir to course dir');

    // Read the uploaded file and parse it into a course structure
    var parsedCourse;
    try {
      parsedCourse = JSON.parse(fs.readFileSync(f.path, 'utf-8'));
    } catch (e) {
      log.error(e);
      //res.redirect('/courses/import', {error: e});
    }

    // Check whether the uploaded course already exists
    course.findOne({name: parsedCourse.title}, function(error, dbCourse) {
      if(error) {
        log.error(error);
        res.render('content_manager', {
          title: '10xEngineer.me Course Creator',
          contentfile: req.param('coursefile', ''),
          error: error
        });
      }

      if(dbCourse) {
        log.error('Course already exists: ' + parsedCourse.title);
        res.render('content_manager', {
          title: '10xEngineer.me Course Creator',
          contentfile: req.param('coursefile', ''),
          error: "Course named " + parsedCourse.title + " already exists in the database. Please delete and re-upload."
        });
      } else {
        parsedCourse['created_by'] = req.user.id;
        course.createNew(parsedCourse, function(error) {
          log.info('new course created.');
          res.redirect('/courses/import?success=true');
        });
      }
    });
  });

  // Load specific course and display chapter index
  app.get('/courses/:id', validCoursePermission('courses', 'read'), loadCourse, function(req, res){
    if (!req.course) {
      res.redirect('/courses/');
    } else {
      log.trace("course", req.course)
    
      //subscribe to the course, if not yet registered
      user.findOrCreateRegisteredCourse(req.user, req.course._id);
    
      var renderParams = {
        title: req.course.title,
      };

      res.render('courses/chapters', renderParams);
    }
  });

  app.get('/courses/:id/edit', validCoursePermission('courses', 'edit'), loadCourse, function(req, res, next){
    if (!req.course) {
      res.redirect('/courses/');
    } else {
      log.trace("course", req.course)
    
      var renderParams = {
        title: req.course.title,
      };

      res.render('courses/edit', renderParams);
    }
  });

  // Remove entire course and its chapters
  app.get('/courses/:id/remove', validCoursePermission('courses', 'delete'), loadCourse, function(req, res, next){
    if (!req.course || req.params.id === 'null') {
      res.redirect('/courses');
    }
    log.info('Removing...');

    // Temporarily allowing everybody to remove courses
    //if (req.is_admin || req.user.id == req.course.created_by) {
      course.removeById(req.params.id, function(error){
        if (error) {
          log.error(error);
        }
        res.redirect('/courses/');
      });
    /*} else {
      log.info(req.user.id + " " + req.course.created_by);
      res.redirect('/courses/' + req.params.id);
    }*/
  });

  app.get('/courses/:id/:unit', validCoursePermission('courses', 'read'), loadCourse, function(req, res){
    if (!req.course) {
      res.redirect('/courses/');
    } else if (!req.unit) {
    
      res.redirect('/courses/' + req.params.id);
    } else {
      // if the user hasn't registered for this course, register them now
      log.trace("course", req.course);
    log.trace("chapter/unit", req.unit);
      req.course.user = user;

      var renderParams = {
        title: req.course.title
      };

      var unit = req.unit;
      if(unit.video && unit.videoType) {
        renderParams['video'] = unit.video;
        renderParams['videoType'] = unit.videoType;
        renderParams['unit_id'] = req.params.unit;
      }
      log.trace('unit: '+req.params.unit);
      res.render('courses/course', renderParams);
    }
  });

  app.get('/courses/:id/:unit/edit', loadCourse, function(req, res){
    if (!req.course) {
      res.redirect('/courses/');
    } else if (!req.unit) {
      res.redirect('/courses/' + req.params.id);
    } else {
      // TODO: let user subscribe to the course instead of this??
      log.trace("course", req.course)
      req.course.user = user;

      var renderParams = {
        title: req.course.title
      };

      var unit = req.unit;
      if(unit.video && unit.videoType) {
        renderParams['video'] = unit.video;
        renderParams['videoType'] = unit.videoType;
      }

      res.render('courses/course', renderParams);
    }
  });

  app.get('/courses/:id/:unit/:lesson', validCoursePermission('courses', 'read'), loadCourse, function(req, res){
    req.course = req.params.id;
    req.unit = req.params.unit;
    req.lesson = req.params.lesson;
  
    if (!req.course) {
      res.redirect('/courses/');
    } else if (!req.unit) {
      res.redirect('/courses/' + req.params.id);
    } else if (!req.lesson) {
      res.redirect('/courses/' + req.params.id + '/' + req.params.unit);
    } else {
      // TODO: let user subscribe to the course instead of this??
    var lesson_progress = user.findOrCreateLesson(req.user, req.course, req.unit, req.lesson, function(lesson_status){
        console.log("lesson_status:"+lesson_status); 
    });
      
      //log.trace("course", req.course)
      req.course.user = user;

      var renderParams = {
        title: req.course.title
      };

      var lesson = req.lesson;
      if(lesson.video && lesson.videoType) {
        renderParams['video'] = lesson.video;
        renderParams['videoType'] = lesson.videoType;
        renderParams['unit_id'] = req.params.unit;
        renderParams['lesson_id'] = req.params.lesson;
      }
      log.trace('unit: '+req.params.unit);
      log.trace('lesson: '+req.params.lesson);
      res.render('courses/course', renderParams);
    }
  });





// --------------------------------------------------------------


  app.get('/course', function(req, res){
    res.render('course', {
      title: '10xEngineer.me Course',
      loggedInUser:req.user
    });
  });

  // Load old course page. TODO: remove when not needed
  app.get('/coursesold', function(req, res){
    res.render('overview', {
      title: '10xEngineer.me Course List', 
    loggedInUser:req.user
    });
  });

  app.get('/program/:course/:unit/:lesson', function(req, res){
    res.render('ide', {
    loggedInUser:req.user,
    code: '',
  compile_result: '',
    compile_output: '',
  course: req.params.course,
  id: req.params.course._id,
  unit_id: req.params.unit,
  lesson_id: req.params.lesson
    });
  });

/* @@TODO: reimplement to show user progress through courses
  app.get('/progress', function(req, res){
    res.render('progress', {
      title: 'Devops', 
      Course: 'CS99',
      Unit: 'Devops',
      loggedInUser: req.user,
      message:''
    });
  });
*/

  // Need to add back :id/:unit/:lesson
  app.get('/quiz/edit', function(req, res){
    res.render('quiz_editor', {
    loggedInUser: req.user,
    message: '',
//    course: req.params.id,
//    unit_id: req.params.unit,
//    lesson_id: req.params.lesson    
    });
  });

  // Temporary course import using json file upload
  app.post('/quiz/upload', function(req, res, next) {
    try {
      var msg = '';

      var f = req.files['files'];
  
      log.info('[Quiz] Uploaded %s -> %s', f.filename, f.path);
  
  
      var tmp_path = f.path;
      var new_name = path.basename(f.path);
      var public_path = 'quiz/' + new_name;
      var target_path = appRoot+'/public/' + public_path;

      var src = '/'+public_path;
      
      log.info('[Quiz] Copying %s -> %s', tmp_path, target_path);
      fs.renameSync(tmp_path, target_path);
      fs.unlink(tmp_path); //Don't use unlinkSync there, it will throw ENOENT as always
      res.send(JSON.stringify({'status': "success", 'message': msg, 'src': src}));
      /*
      , function(err) {

        if(err){
          msg = "Error occur in file system (Relocation)";
          console.log("Upload Error:", msg, err)
          res.send(JSON.stringify({'status': "error", 'message': msg }))
          throw err;
        } 

        // delete the temporary file

        fs.unlink(tmp_path, function(err) {

          if(err){
            msg = "Error occur in file system (Clearing)";
            console.log("Upload Error:", msg, err);
            res.send(JSON.stringify({'status': "error", 'message': msg }))
            throw err;
          }

          msg = 'File uploaded, Size: '+ f.size + ' bytes';
          res.send(JSON.stringify({'status': "success", 'message': msg, 'src': src}));

        });

      });*/
    } catch (e) {
      console.log("[Quiz] Error in Quiz upload", e)
       res.send(JSON.stringify({'status': "error", 'message': e.message }))
    }

  });

  app.post('/quiz/save', function(req, res, next) {
    
    //TODO: implement the save logic there
    
    res.send(JSON.stringify({'status': "OK", 'message': "Quiz Saved" }))
    
  })


  app.get('/quiz/:id/:unit/:lesson', function(req, res){
    res.render('quiz', {
    loggedInUser: req.user,
    message: '',
    course: req.params.id,
    unit_id: req.params.unit,
    lesson_id: req.params.lesson    
    });
  });

  // mock router to send dummy output. 
  app.post('/quiz/:id/:unit/:lesson', function(req, res, next){
    var is_correct = false;
    var ans = req.body['quiz-1']; //@@TODO
    //guard
    log.info("GET params: ", req.params); //get or router params
    log.info("POST params",req.body); //post
    
    //process the login there.
    if(ans === 'A')
      is_correct = true;
      
    res.render('quiz', {
      title: 'Devops Quiz',
    message: 'Your answer is: '+ ans + ". "+ ((is_correct) ? "That is correct!":"That is wrong"),
    loggedInUser: req.user,
    correct: is_correct,
    choice: ans,
    course: req.params.id,
    unit_id: req.params.unit,
    lesson_id: req.params.lesson 
    });

  });

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

}
