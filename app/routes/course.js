var request = require('request');
var fs = require('fs');
var path = require('path')

// Load models
var Course = load.model('Course');
var User = load.model('User');
var Chapter = load.model('Chapter');
var Lesson = load.model('Lesson');
var Progress = load.model('Progress');

var importer = load.helper('importer');

module.exports = function() {};

// List existing courses
module.exports.list = function(req, res){
  var formatedProgress = {};
  Course.find({}, function(error, courses){
    Progress.find({ user: req.user._id }, function(error, progresses){
      for(var index = 0; index < progresses.length; index++){
        var progress = progresses[index];
        formatedProgress[progress.course] = progress.status;
      }
      res.render('courses', { 
        title: 'Courses',
        courses: courses,
        progress : formatedProgress
      });
    });
  })
};

// Create new course form
module.exports.createView = function(req, res){
  res.render('courses/create', {
    title: 'New Course',
    course: {_id:'',title:'',description:''},
  });
};

// Create a new course
module.exports.create = function(req, res, next){
  var course = new Course();
  var util = load.helper('util');
  course.title = req.body.title;
  course.desc = req.body.description;
  course.image = req.body.image;
  course.cropImgInfo = req.body.cropImgInfo;
  course.created_by = req.user._id;

  course.save(function(error) {
    if(error) {
      log.error(error);
      error = "Can not create course.";
      next(error);
    }

    var id = course.id;

    //Set the course info in the session to let socket.io know about it.
    req.session.newCourse = {title: course.title, _id: course._id};
    message = "Course created successfully.";
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
    error = "Can not import course.";
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
    message = "Import Sucessfully Course.";
    res.redirect('/courses');
  });
};


//TODO : Go to the last lesson if course already started
//TODO : Also add this course to the users registered courses
// Register for a course (if not already registered, and Go to the last viewed or first lesson. 
module.exports.start = function(req, res, next){
  // Check if user has already started the course
  Progress.startOrContinue(req.user, req.course, function(error, progress) {
    if(error) {
      log.error(error);
      next(error);
    }

    // Redirect the user to first unfinished lesson
    progress.getNextLesson(function(error, nextLesson) {
      res.redirect('/lesson/' + nextLesson);
    });
  });
};

// Load specific course and display chapter index
module.exports.show = function(req, res, next){

  Progress.findOne({ user: req.user._id, course: req.course._id }, function(error, progress) {
    if(error) {
      callback(error);
    }
    res.render('courses/chapters', {
      title: req.course.title,
      chapter: undefined,
      index :0,
      progressObject : progress
    });
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
  var course = req.course;
  course.title = req.body.title;
  course.desc = req.body.description;
  course.image = req.body.image;

  course.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not updated course.";
    }
    req.session.message = "Course updated sucessfully.";
    res.redirect('/course/' + course.id);
  });
};

// Remove entire course and its chapters
module.exports.remove = function(req, res, next){
  
  var course = req.course;

  course.removeCourse(function(error){
    if (error) {
      log.error(error);
      error = "Can not remove course.";
    }
    message = "Sucessfully course removed.";
    res.redirect('/courses/');
  });
};