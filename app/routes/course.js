var request = require('request');
var fs = require('fs');
var path = require('path');

var model = require('../models');

var importer = require('../helpers/importer');
var util = require('../helpers/util');

module.exports = function() {};


// List all courses
module.exports.list = function(req, res, next){
  log.profile('course.list');
  var Course = model.Course;
  var Progress = model.Progress;
  
  var formatedProgress = {};
  Course.find({}, function(error, courses){
    if(error) return next(error);

    // TODO: Do a map-reduce instead
    var featuredCourses = [];
    var regularCourses = [];

    for(var index = courses.length - 1; index >= 0; index--) {
      var course = courses[index];
      if(course.featured) {
        featuredCourses.push(course);
      } else {
        regularCourses.push(course);
      }
    }

    Progress.find({ user: req.user._id }, function(error, progresses){
      if(error) return next(error);
      for(var index = progresses.length - 1; index >= 0; index--){
        var progress = progresses[index];
        formatedProgress[progress.course] = progress.status;
      }
      log.profile('course.list');
      res.render('courses', { 
        title: 'Courses',
        regularCourses: regularCourses,
        featuredCourses: featuredCourses,
        progress : formatedProgress
      });
    });
  });
};

// Register for a course (if not already registered, and Go to the last viewed or first lesson. 
module.exports.start = function(req, res, next){
  // Check if user has already started the course
  var Progress = model.Progress;
  Progress.startOrContinue(req.user, req.course, function(error, progress) {
    if(error) return next(error);
    // Redirect the user to first unfinished lesson
    progress.getNextLesson(function(error, nextLesson) {
      if(error) return next(error);
      res.redirect('/lesson/' + nextLesson);
    });
  });
};

// Load specific course and display chapter index
module.exports.show = function(req, res, next){
    
  var Progress = model.Progress;

  // Find Progres For Start / COntinue Button
  Progress.getProgress(req.user, req.course, function(error, progress) {
    if(error) return next(error);
    res.render('courses/courseDetails', {
      title     : req.course.title,
      chapter   : undefined,
      index     : 0,
      progress  : progress
    });
  });
};