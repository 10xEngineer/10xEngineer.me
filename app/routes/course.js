var request = require('request');
var fs = require('fs');
var path = require('path')

// Load models
var Course = load.model('Course');
var User = load.model('User');

var importer = load.helper('importer');


module.exports = function() {};

// List existing courses
module.exports.list = function(req, res){
  var registered_courses = [];
  if( typeof(req.user) != 'undefined' && typeof(req.user.registered_courses) != 'undefined') {
    registered_courses = req.user.registered_courses;
  }

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
  var course = new Course();
  course.title = req.body.title;
  course.desc = req.body.description;
  course.image = req.body.image;
  course.created_by = req.user._id;

  course.save(function(error) {
    if(error) {
      log.error(error);
    }

    var id = course.id;

    //Set the course info in the session to let socket.io know about it.
    req.session.newCourse = {title: course.title, _id: course._id};
    res.redirect('/course/' + id);
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
    //res.redirect('/course/import', {error: e});
  }

  // Create a new course based on the parsed file
  importer.course(parsedCourse, function(error, course) {

    // Add chapters
    var chapters = parsedCourse.chapters;
    if(!chapters.length || chapters.length === 0) {
      res.redirect('/courses');
    }

    var chapterLength = chapters.length;
    for(var index = 0; index < chapterLength; index++) {
      var chapterData = chapters[index];

      importer.chapter(chapterData, course._id, function(error, chapter, lessons) {

        var lessonLength = lessons.length;
        for(var index2 = 0; index2 < lessonLength; index2++) {
          var lessonData = lessons[index2];
          importer.lesson(lessonData, chapter._id);          
        }
      });
    }

    // Success
    res.redirect('/courses');
  });
};

// Load specific course and display chapter index
module.exports.show = function(req, res){
  res.render('courses/chapters', {
    title: req.course.title,
    chapter: undefined
  });
};

// Edit course
module.exports.updateView = function(req, res, next){
  res.render('courses/edit', {
    title: req.course.title
  });
};

// TODO: Update course
module.exports.update = function(req, res, next){
  res.render('courses/edit', {
    title: req.course.title
  });
};

// Remove entire course and its chapters
module.exports.remove = function(req, res, next){
  log.info('Removing course...');

  var course = req.course;

  course.removeCourse(function(error){
    if (error) {
      log.error(error);
    }
    res.redirect('/courses/');
  });
};


