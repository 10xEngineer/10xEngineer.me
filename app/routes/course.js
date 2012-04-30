var request = require('request');
var fs = require('fs');
var path = require('path')

// Load models
var Course = load.model('Course');
var User = load.model('User');


module.exports = function() {};

// List existing courses
module.exports.list = function(req, res){
  var registered_courses = [];
  if( typeof(req.user) != 'undefined' && typeof(req.user.registered_courses) != 'undefined') {
    registered_courses = req.user.registered_courses;
  }

  log.info('user = ', req.user);
  log.info('registered courses = ', registered_courses);
  Course.find({}, function(error, courses){
    res.render('courses', { 
      title: 'Courses',
      courses: courses,
      registered_courses: registered_courses
    });
  });
};

// Create new course form
module.exports.createView = function(req, res){
  res.render('courses/create', {
    title: 'New Course',
    course: {_id:'',title:'',description:''},
  });
};

// Create a new course
module.exports.create = function(req, res){
  validateCourseData(req, function (error, data){
    if (error) {
      log.error(error);
      res.redirect('/course/create/?' + error);
    } else {
      if (!data.created_by) {
        data.created_by = req.user.id;
      }
      Course.createNew( data, function( error, course) {
        id = course._id;

        //Set the course info in the session to let socket.io know about it.
        req.session.newCourse = {title: course.title, _id: id};
        res.redirect('/courses/' + id);
      });
    }
  });
};

// TODO: Quick course import tool. Modify to support the new course format
module.exports.importView = function(req, res){
  res.render('content_manager', {
    title: '10xEngineer.me Course Creator',
    description: 'Create courses with its units from JSON file.',
    contentfile: req.param('coursefile', ''),
    success: req.params.success || false
  });
};

// Temporary course import using json file upload
module.exports.import = function(req, res, next) {

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
};

// Load specific course and display chapter index
module.exports.show = function(req, res){
  if (!req.course) {
    res.redirect('/courses/');
  } else {
    log.trace("course", req.course)
    
    var renderParams = {
      title: req.course.title,
    };

    res.render('courses/chapters', renderParams);
  }
};

// Edit course
module.exports.updateView = function(req, res, next){
  if (!req.course) {
    res.redirect('/courses/');
  } else {
    log.trace("course", req.course)
  
    var renderParams = {
      title: req.course.title,
    };

    res.render('courses/edit', renderParams);
  }
};

// TODO: Update course
module.exports.update = function(req, res, next){
  if (!req.course) {
    res.redirect('/courses/');
  } else {
    log.trace("course", req.course)
  
    var renderParams = {
      title: req.course.title,
    };

    res.render('courses/edit', renderParams);
  }
};

// Remove entire course and its chapters
module.exports.remove = function(req, res, next){
  if (!req.course || req.params.id === 'null') {
    res.redirect('/courses');
  }
  log.info('Removing...');

  course.removeById(req.params.id, function(error){
    if (error) {
      log.error(error);
    }
    res.redirect('/courses/');
  });
};


