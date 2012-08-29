var request = require('request');
var fs = require('fs');
var path = require('path');

var model = require('../models');

var progressHelper = require('../helpers/progress');
var importer = require('../helpers/importer');
var util = require('../helpers/util');

module.exports = function() {};

// List existing all courses
module.exports.allList = function(req, res){
  var Course = model.Course;
  var Progress = model.Progress;

  var formatedProgress = {};
  Course.find({}, function(error, courses){
    Progress.find({ user: req.user._id }, function(error, progresses){
      for(var index = 0; index < progresses.length; index++){
        var progress = progresses[index];
        formatedProgress[progress.course] = progress.status;
      }
      res.render('courses/allList', { 
        title: 'Courses',
        courses: courses,
        progress : formatedProgress
      });
    });
  });
};

// List existing featured courses
module.exports.featuredList = function(req, res){
  log.profile('courseList');
  var Course = model.Course;
  var Progress = model.Progress;
  
  var formatedProgress = {};
  Course.find({ featured : true }, function(error, courses){
    Progress.find({ user: req.user._id }, function(error, progresses){
      for(var index = 0; index < progresses.length; index++){
        var progress = progresses[index];
        formatedProgress[progress.course] = progress.status;
      }
      log.profile('courseList');
      res.render('courses', { 
        title: 'Courses',
        courses: courses,
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
    if(error) {
      log.error(error);
      next(error);
    }

    // Redirect the user to first unfinished lesson
    progress.getNextLesson(function(error, nextLesson) {
      log.info(nextLesson);
      res.redirect('/lesson/' + nextLesson);
    });
  });
};

// Load specific course and display chapter index
module.exports.show = function(req, res, next){
    
  var Progress = model.Progress;

  // Find Progres For Start / COntinue Button
  Progress.getProgress(req.user, req.course, function(error, progress) {
    if(error) {
      log.error(error);
    }
    res.render('courses/courseDetails', {
      title: req.course.title,
      chapter: undefined,
      index :0,
      progress : progress
    });
  });
};