var mongo = require('mongoskin');
var bcrypt = require('bcrypt'); 
var request = require('request');
var fs = require('fs');

// Load models
var course = require('../models/course');
var user = require('../models/user');
var category = require('../models/category');


// ---------------------
// Middleware
// ---------------------

var validateCourseData = function (req, callback) {
  errors = [];
  data = {};
  
  if (!req.param) {
    errors.push('No course to validate!');  
  }
  else {
    if (!req.param('title')) {
      errors.push('Title required.');  
    }
    if (!req.param('content')) {
      errors.push('Content required.');  
    }
  }
  if (errors.length > 0) {
    callback(errors);
  }
  else {
    data.title = req.param('title');
    data.content = req.param('content');
    data.category = req.param('category');
    data.modified_at = new Date();
    if (!req.param('_id')) {
      data.created_at = new Date();
    }
    if (!req.user.id && !req.param('_id')) {
      data.requires_verification = true;
      if (!req.param('email')) {
        callback('Email address required.');
      }
      else {
        user.findByEmail(req.param('email'), function( error, user) {
          if (user && user.id) {
            data.user_id = user._id;
            callback( null, data);
          } else {
            var newUser = {email: req.param('email')};
            var promise = new Promise();
            user.createNew(newUser, 'email', function(error, user) {
              if(error) {
                callback(error);
              }
              callback( null, data);
            });
          }
        });
      }
    }
    else {
      callback( null, data);
    }
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
  var unit = parseInt(req.params.unit);
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
      if(typeof(unit) != 'undefined') {
        unit = parseInt(unit);
        if(typeof(lesson) != 'undefined') {
          lesson = parseInt(lesson);
        } else {
          // Set default lesson value
          lesson = 0;
        }
      } else {
        // Set default unit value
        unit = 0;
      }
    } catch (e) {
      log.error(e);
      next();
    }

    // Check if specified unit exists. If not, redirect to course home
    if(course && course.units && course.units[unit-1]) {
      // Set the unit object in UI helper
      var unitObj = req.unit = helper['unit'] = course.units[unit-1];

      // Check if specified lesson exists. If not, redirect to unit home
      if(unitObj.lessons && unitObj.lessons[lesson-1]) {
        // Set the lesson object in UI helper
        req.lesson = helper['lesson'] = unitObj.lessons[lesson-1];
      }
    }

    req.app.helpers(helper);
    next();
  });
}


var loadCategories = function (req, res, next) {
  category.getAll(function(error, categories) {
    req.app.helpers({
      categories: categories 
    });
    next();
  });
}


// ------------
// Routes
// ------------
module.exports = function (app) {

  // List existing courses
  app.get('/courses', loadCategories, function(req, res){

    course.get({
      category: req.param.category
    }, function(error, courses){
      res.render('courses', { 
        title: 'Courses',
        courses: courses
      });
    });
  });

  // Create new course form
  app.get('/courses/create', loadCategories, function(req, res){
    res.render('courses/create', {
      title: 'New Course',
      course: {_id:'',title:'',category:'',content:''},
      //headContent:'course_create' 
    });
  });

  // Create a new course
  app.post('/courses/create', function(req, res){
    validateCourseData(req, function (error, data){
      if (error) {
        log.error(error);
        res.redirect('/course/create/?' + error);
      }
      else {
        if (!data.created_by) {
          data.created_by = req.user.id;
        }
        course.createNew( data, function( error, course) {
          id = course._id;
          // Set session value so we can push out new course
          if (data.requires_verification) {
            var verifySalt = bcrypt.gen_salt_sync(10);  
            var verifyHash = bcrypt.encrypt_sync(data.title+data.created_at, verifySalt);
            var verifyLink = siteInfo.site_url + "/course/" + course._id + "/verify/?verify="+verifyHash; 
            var deleteLink = siteInfo.site_url + "/course/" + course._id + "/remove?verify="+verifyHash; 
            var verificationMessage = "Hi!<br /> Click to verify your course '" + course.title + "' <a href=\"" + verifyLink + "\">" + verifyLink + "</a>!";
            verificationMessage += "<br /><br />When you're done with it, you can delete the course from this link: <a href=\"" + deleteLink + "\"" + deleteLink + "</a>";
            // Add an edit link some day.
            log.info(verificationMessage);
            mail.message({
              'MIME-Version': '1.0',
              'Content-type': 'text/html;charset=UTF-8',
              from: 'Management <' + siteInfo.site_email  + '>',
              to: [req.param('email')],
              subject: 'Verify Course'
            })
            .body(verificationMessage)
            .send(function(err) {
              if (err) log.error(err);
            });
            res.redirect('/course/verify');
          }
          else {
            //Set the course info in the session to let socket.io know about it.
            req.session.newCourse = {title: course.title, _id: id};
            res.redirect('/courses/' + id + '/edit');
          }
        });
      }
    });
  });

  // TODO: Quick course import tool
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

  app.get('/courses/:id', loadCourse, function(req, res){
    if (!req.course) {
      res.redirect('/courses/');
    } else {
      // TODO: let user subscribe to the course instead of this??
      log.trace("course", req.course)
      req.course.user = user;

      var renderParams = {
        title: req.course.title
      };

      var unit = req.unit;
      if(unit && unit.video && unit.videoType) {
        renderParams['video'] = unit.video;
        renderParams['videoType'] = unit.videoType;
      }
      
      res.render('courses/course', renderParams);
    }
  });

  app.get('/courses/:id/edit', loadCategories, loadCourse, function(req, res, next){
    if (req.course && (req.user.role === 'admin' || req.user._id === req.course.created_by)) {
      res.render('courses/edit', {
        title: 'Course ' + req.course.title,
        headContent:'course_edit'
      });
    }
    else {
      res.redirect('/courses/' + req.params.id);
    }
  });

  app.get('/courses/:id/remove', loadCourse, function(req, res, next){
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

  app.get('/courses/:id/:unit', loadCourse, function(req, res){
    if (!req.course) {
      res.redirect('/courses/');
    } else if (!req.unit) {
      res.redirect('/courses/' + req.params.id);
    } else {
      // TODO: let user subscribe to the course instead of this??
      //log.trace("course", req.course)
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

  app.get('/courses/:id/:unit/:lesson', loadCourse, function(req, res){
    if (!req.course) {
      res.redirect('/courses/');
    } else if (!req.unit) {
      res.redirect('/courses/' + req.params.id);
    } else if (!req.lesson) {
      res.redirect('/courses/' + req.params.id + '/' + req.params.unit);
    } else {
      // TODO: let user subscribe to the course instead of this??
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
