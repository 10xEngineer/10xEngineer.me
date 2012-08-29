var fs = require('fs');

var _ = require('lodash');

var model = require('../models');

var cdn = require('../helpers/cdn');
var progressHelper = require('../helpers/progress');


module.exports = function() {};

// Display a lesson
module.exports.showView = function(req, res) {
  
  var Lesson = model.Lesson;
  var Assessment = model.Assessment;
  var Progress = model.Progress;
  var lesson = req.lesson;

  // For Progress
  var videoStartTime = 0;
  var progressFlag = false;

  // Check if progress has already status completed  
  Progress.getProgress(req.user, req.course, function(error, progress) {
    if(error) {
      log.error(error);
    }

    if(progress.status != 'completed') {

      // Start the Lesson : Change status of lesson to 'ongoing'
      progress.startLesson(lesson, function(error) {
        if(error) {
          log.error(error);
        }
        var chapters = progress.chapters;
        var chaptersLength = chapters.length;
        
        for (var index = 0; index < chaptersLength; index++) {
          if(chapters[index]._id.toString() == lesson.chapter._id.toString()) {
            var lessons = chapters[index].lessons;
            var lessonsLength = lessons.length;
            for (var lenssonIndex = 0; lenssonIndex < lessonsLength; lenssonIndex++) {
              if(lessons[lenssonIndex]._id.toString() == lesson._id.toString()) {
                if(typeof(lessons[lenssonIndex].video) != undefined) {
                  if(! lessons[lenssonIndex].video) {
                    lessons[lenssonIndex].video = {};
                  }
                  videoStartTime = lessons[lenssonIndex].video.videoProgress;
                  break;
                }
              }
            }
          }
        }
        
        progressFlag = true;
        Lesson.find({}, function(error, allLessons) {
          Assessment.findOne({'user.id': req.user._id, 'lesson.id': req.lesson._id}, function(err, assessment){
            var ass;
            if(err){
              console.log(err);
              ass = {};
            }
            else {
              ass = assessment;
            }
            res.render('lessons/' + lesson.type, {
              title           : lesson.title,
              quiz            : lesson.quiz,
              assessment      : ass,
              videoStartTime  : videoStartTime,
              userName        : req.user.name,
              allLessons      : allLessons,
              userId          : req.user._id,
              progressFlag    : progressFlag
            });
          });
        });
      });

    } else {
      progressFlag = true;
      Lesson.find({}, function(error, allLessons) {
        res.render('lessons/' + lesson.type, {
          title: lesson.title,
          quiz: lesson.quiz,
          videoStartTime: videoStartTime,
          allLessons: allLessons,
          userId: req.user._id,
          progressFlag : progressFlag
        });
      });
    }
  });
};

// For random the options
var randomOption =function (options) {
  var temp;
  var optionLength = Math.floor(options.length/2)+1;
  
  for (var i = 0; i < optionLength; i++) {

    var n = Math.floor(Math.random() * optionLength);
    temp = options[i];
    options[i]= options[n];
    options[n]=temp;

  }
};

module.exports.show = function(req, res) {
  
  var Lesson   = model.Lesson;
  var Progress = model.Progress;
  var lesson   = req.lesson;


  // Check if progress has already status completed  
  Progress.getProgress(req.user, req.course, function(error, progress) {
    if(error) {
      log.error(error);
    }
    if(progress.status != 'completed') {
      // Start the Lesson : Change status of lesson to 'ongoing'
      progress.completeLesson(lesson, function(error) {
        if(error) {
          log.error(error);
        }
      });
    } 
    renderLesson();      
  });
};

var renderLesson = function(){
  Lesson.find({}, function(error, allLessons){
    res.render('lessons/' + lesson.type, {
      title: req.lesson.title,
      allLessons : allLessons
    });
  });    
};

// Lesson Completes
module.exports.complete = function(req, res) {
  var Progress = model.Progress;

  res.contentType('text/plain');
  Progress.findOne({ user: req.user._id, course: req.course._id}, function(error, progress) {
    if(error) {
      log.error(error);
      res.end("false");
    }
    var lessonVideo = {};
    lessonVideo.chapter = req.chapter.id;
    lessonVideo.lesson  = req.lesson.id;
    progress.completeLesson(lessonVideo, function(error){
      if(error) {
        log.error(error);
        res.end("false");
      }
      res.end("true");
    });
  });
};

// Lesson ServerInfo
module.exports.serverInfo = function(req, res) {
  var VMDef = model.VMDef;
  
  res.contentType('text/plain');
  var id = req.query.id;

  VMDef.findById(id, function (error, lab) {
    if(error) {
      log.error(error);
      res.end("false");
    }
    res.json({
      serverInfo : {
        cpu: lab.cpu,
        id: lab.id,
        memory: lab.memory,
        name: lab.name,
        storage: lab.storage,
        type: lab.type,
        runList: lab.runList
      }
    });
  });
};

// For Next Or Previous Lesson
module.exports.next = function(req,res){

  var lesson = req.lesson;

  lesson.getNext(function(error,nextLessonID) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved to next lesson.";
    }  
    if(nextLessonID == null) {
      res.redirect('/course/' + req.course.id);
    } else {
      res.redirect('/lesson/' + nextLessonID);
    }
  });
  
};

module.exports.previous = function(req,res){

  var lesson = req.lesson;

  lesson.getPrevious(function(error,preLessonID) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved to previous lesson.";
    }
    if(preLessonID == null) {
      res.redirect('/course/' + req.course.id);
    } else {
      res.redirect('/lesson/' + preLessonID);
    }
  });
  
};
