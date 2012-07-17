var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');

var Progress = mongoose.model('Progress');
var User = mongoose.model('User');
var Course = mongoose.model('Course');
var Chapter = mongoose.model('Chapter');
var User = mongoose.model('User');
var Lesson = mongoose.model('Lesson');

module.exports = function() {};


// Store Progress into Session
module.exports.get = function(userId, callback) {

  User.findOne({id: userId}, function(error,user){
    if(error) {
      log.error(error);
      callback(error);
    }
    Progress.find({user: user._id}, function(error, progress) {
      if(error) {
        log.error(error);
        callback(error);
      }
      var progressLength = progress.length;
      var progressJSON = {};
      for (var progressIndex = 0; progressIndex < progressLength; progressIndex++) {
        var key = progress[progressIndex].course;
        var value = progress[progressIndex];
        progressJSON[key] = value;
      };
      callback(null, progressJSON);
    });
  });
};

// Change the status of sessionProgress to start
module.exports.start = function(lesson, session) {

  var progress = session.progress;
  var courseId = lesson.chapter.course;
  var chapterId = lesson.chapter.id;
  var lessonId = lesson.id;

  var chapters = progress[courseId].chapters;

  var length = chapters.length;

  for (var index = 0; index < length; index++) {
    if(chapters[index].id == chapterId) {
      var lessons = chapters[index].lessons;
      var lessonsLength = lessons.length;
      for (var lessonindex = 0; lessonindex < lessonsLength; lessonindex++) {
        if(lessons[lessonindex].id == lessonId) {
          lessons[lessonindex].status = 'ongoing';
        }
      }
    }
  }
  progressCalculate(session, courseId);
};

// Change the status of sessionProgress to completed
module.exports.completed = function(data, session) {

  var progress = session.progress;
  var courseId = data.chapter.course;
  var chapterId = data.chapter._id;
  var lessonId = data._id;
  var chapters = progress[courseId].chapters;
  var length = chapters.length;

  for (var index = 0; index < length; index++) {
    if(chapters[index]._id == chapterId) {
      var lessons = chapters[index].lessons;
      var lessonsLength = lessons.length;
      for (var lessonindex = 0; lessonindex < lessonsLength; lessonindex++) {
        if(lessons[lessonindex]._id == lessonId) {
          lessons[lessonindex].status = 'completed';
        }
      }
    }
  }
  saveSession(session);
  progressCalculate(session, courseId);
};

// Change the status of video lesson sessionProgress to completed
module.exports.lessonCompleted = function(data, session) {

  var progress = session.progress;
  var courseId = data.courseId;
  var chapterId = data.chapterId;
  var lessonId = data.lessonId;
  var chapters = progress[courseId].chapters;
  var length = chapters.length;

  for (var index = 0; index < length; index++) {
    if(chapters[index]._id == chapterId) {
      var lessons = chapters[index].lessons;
      var lessonsLength = lessons.length;
      for (var lessonindex = 0; lessonindex < lessonsLength; lessonindex++) {
        if(lessons[lessonindex]._id == lessonId) {
          if(data.data) {
            lessons[lessonindex].sourse = data.data;
          }
          lessons[lessonindex].status = 'completed';
        }
      }
    }
  }
  saveSession(session);
  progressCalculate(session, courseId);
};

// Set the video / programming lesson sessionProgress
module.exports.lessonUpdateProgress = function(data, session) {

  var progress = session.progress;
  var courseId = data.courseId;
  var chapterId = data.chapterId;
  var lessonId = data.lessonId;
  
  var chapters = progress[courseId].chapters;
  var length = chapters.length;

  for (var index = 0; index < length; index++) {
    if(chapters[index].id == chapterId) {
      var lessons = chapters[index].lessons;
      var lessonsLength = lessons.length;
      for (var lessonindex = 0; lessonindex < lessonsLength; lessonindex++) {
        if(lessons[lessonindex].id == lessonId) {
          if(data.type == "video") {
            lessons[lessonindex].videoProgress = data.data;
          } else if(data.type == "programming") {
            lessons[lessonindex].videoProgress = data.data;
          }
        }
      }
    }
  }
  saveSession(session);
  progressCalculate(session, courseId);
};

// Persists current progress session in mongodb
module.exports.update = function(data, progressSession) {
  var courseId = data.courseId;
  var userId = data.userId;
  
  Progress.findOne({user: userId, course: courseId}, function(error, progress) {
    if(error) {
      log.error(error);
    }

    progress.chapters = progressSession[courseId].chapters;
    
    progress.markModified('chapters');
    progress.save(function(error) {
      if(error) {
        log.error(error);
      }
    });
  });
};

// Progress Calvulates
var progressCalculate = function(session, courseId) {

  var progress = session.progress[courseId];
  if(progress.status !== 'completed') {

    // Load course
    Course.findById(progress.course)
      .populate('chapters')
      .run(function(error, course) {

      var chapters;

      if(progress.chapters && progress.chapters.length > 0) {
        chapters = progress.chapters;

        var chapterIndex = 0;
        async.forEachSeries(chapters, function(chapter, chapterCallback) {

          var lessonProgress = 0;
          var pLessons = chapter.lessons;
          var lessonIndex = 0;

          var lessonProgress = _.reduce(pLessons, function(count, lesson) {
            if(lesson.status == 'completed') {
              return ++count;
            } else {
              return count;
            }
          }, 0);

          chapter.progress = lessonProgress / pLessons.length * 100;
          if(chapter.progress == 100) {
            chapter.status = 'completed';
          }

          chapterCallback();
        },
        function(error) {
          var chapterProgress = _.reduce(progress.chapters, function(count, chapter) {
            if(chapter.status == 'completed') {
              return ++count;
            } else {
              return count + (chapter.progress/100);
            }
          }, 0);

          progress.progress = chapterProgress / chapters.length * 100;
          if(progress.progress == 100) {
            progress.status = 'completed';
          }

          saveSession(session);

        });

      } else {
        chapters = course.chapters;

        var chapterIndex = 0;
        async.forEachSeries(chapters, function(chapter, chapterCallback) {

          var lessons = [];
          var lessonProgress = 0;
          var pLessons = chapter.lessons;
          var lessonIndex = 0;

          async.forEachSeries(pLessons, function(lesson, lessonCallback) {
            Lesson.findById(lesson, function(error, lesson) {
              if(error) {
                next(error);
              }

              lessons.push({
                _id: lesson._id,
                id: lesson.id,
                seq: lessonIndex++,
                status: 'not-started'
              });

              lessonCallback();
            });
          }, function(error) {
            var lessonProgress = _.reduce(pLessons, function(count, lesson) {
              if(lesson.status == 'completed') {
                return ++count;
              } else {
                return count;
              }
            }, 0);

            if(pLessons.length > 0) {
              lessonProgress = lessonProgress / pLessons.length * 100;
            }
            
            progress.chapters.push({
              _id: chapter._id,
              id: chapter.id,
              seq: chapterIndex++,
              lessons: lessons,
              progress: lessonProgress,
              status: 'not-started'
            });

            lessons = [];

            chapterCallback(error);
          });
        },
        function(error) {
          var chapterProgress = _.reduce(progress.chapters, function(count, chapter) {
            if(chapter.status == 'completed') {
              return ++count;
            } else {
              return count + (chapter.progress/100);
            }
          }, 0);

          progress.progress = chapterProgress;
          progress.status = 'ongoing';

          saveSession(session);
          
        });
      }
    });
    
  }
};

var saveSession = function(session, callback) {
  session.save(callback);
};