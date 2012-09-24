var async = require('async');
var _ = require('lodash');

var model = require('./index');

var statics = {
  userChapterProgress: function(user, callback) {
    var Progress = this;

    Progress.find({ user: user._id })
      .populate('course')
      .exec(callback);
  },

  startOrContinue: function(user, course, callback) {
    var Progress = this;

    Progress.findOne({ user: user._id, course: course._id }, function(error, progress) {
      if(error) return callback(error);

      if(!progress) {
        // Sign the user up for current course
        progress = new Progress();
        progress.user = user;
        progress.course = course;
        progress.save(function(error) {
          if(error) return callback(error);
          Progress.findOne({user: user._id, course: course._id}, callback);
        });
      } else {
        callback(null, progress);
      }
    });
  },

  getProgress: function(user, course, callback) {
    var Progress = this;

    Progress.findOne({ user: user._id, course: course._id }, function(error, progress) {
      if(error) return callback(error);

      if(!progress) {
        callback(new Error('Progress unavailable')); 
      } else {
        callback(null, progress);
      }
    });
  },

  removeCourseProgress: function(course_Id, callback) {
    Progress = this;

    Progress.remove({course:course_Id}, callback);
  },

  updateProgress: function(data, callback) {
    Progress = this;

    var courseId = data.courseId;
    var chapterId = data.chapterId;
    var lessonId = data.lessonId;
    var userId = data.userId;

    Progress.findOne({ user: userId, course: courseId }, function(error, progress) {
      if(error) return callback(error);

      if(!progress) {
        callback(new Error('Invalid Progress')); 
      } else {
        
        var chapters = progress.chapters;
        
        for (var chapterIndex in chapters) {
          var chapter = chapters[chapterIndex];
          if(chapter.id.toString() == chapterId){
            for(var lessonIndex in chapter.lessons) {
              var lesson = chapter.lessons[lessonIndex];
              if(lesson.id.toString() == lessonId) {
                if(data.type == "video") {
                  if(!lesson.video) {
                    lesson.video = {};
                  }
                  lesson.video.videoProgress = data.data;
                } else if(data.type == "programming") {
                  if(!lesson.programming) {
                    lesson.programming = {};
                  }
                  lesson.programming.code = data.data;
                }
                break;
              }
            }
          }
        }
        
        progress.markModified('chapters');
        progress.save(callback);
      }
    });
  },

  completedLesson: function(data, callback) {
    
    Progress = this;
    var courseId = data.courseId;
    var chapterId = data.chapterId;
    var lessonId = data.lessonId;
    var userId = data.userId;

    Progress.findOne({ user: userId, course: courseId }, function(error, progress) {
      if(error) return callback(error);
      if(!progress) {
        callback(new Error('Invalid Progress')); 
      } else {
        
        var chapters = progress.chapters;
        
        for (var chapterIndex in chapters) {
          var chapter = chapters[chapterIndex];
          if(chapter._id.toString() == chapterId){
            for(var lessonIndex in chapter.lessons) {
              var lesson = chapter.lessons[lessonIndex];
              if(lesson._id.toString() == lessonId) {
                lesson.status = 'completed';
                break;
              }
            }
          }
        }
        
        progress.markModified('chapters');
        progress.save(callback);
      }
    });
  }
};

var methods = {
  getNextLesson: function(callback) {
    var progress = this;

    // TODO: Iterate through all the modules and lessons -> Find a lesson, which isn't completed having the least sequence number
    var chapters = [];
    for(var indx in progress.chapters){
      chapters.push(progress.chapters[indx]);
    }

    var combinedChapters = _.reduce(chapters, function(list, chapter) {
      var lessons = [];
      for(var less in chapter.lessons){
        lessons.push(chapter.lessons[less]);
      }

      var lessonList = (function(chapterSeq) {
        return _.reduce(lessons, function(list, lesson) {
          if(lesson.status != 'completed') {
            var seq = (chapterSeq + 1) * 1000 + lesson.seq;
            return list.concat({ seq: seq, id: lesson.id });
          } else {
            return list;
          }
        }, []);
      })(chapter.seq);

      return list.concat(lessonList);
    }, []);
    var sortedChapters = _.sortBy(combinedChapters, function(lesson) {
      return lesson.seq;
    });

    if(sortedChapters.length == 0) {
      callback(new Error('No chapters'));
    } else {
      var nextLesson = sortedChapters[0];

      callback(null, nextLesson.id);      
    }
  },

  startLesson: function(lesson, callback) {
    changeLessonState(lesson, 'ongoing', callback);
  },

  completeLesson: function(lesson, callback) {
    changeLessonState(lesson, 'completed', callback);
  }
};

module.exports = {
  name: 'Progress',
  schema: require('./schema/progress'),
  options: {
    methods: methods,
    statics: statics,
    plugins: ['timestamp', 'progress']  
  }
};

var changeLessonState = function(lesson, state, callback) {
  var progress = this;
  var lessonId  = lesson._id.toString();
  var chapterId = lesson.chapter._id.toString();
  var quiz = lesson.quiz;
  var chapters = progress.chapters;
  var progressChapterLength = chapters.length;
  if(quiz) {
    var attemptedAnswers = lesson.attemptedAnswers;
  }

  for (var chapterIndex in chapters) {
    var chapter = chapters[chapterIndex];
    if(chapter._id.toString() == chapterId){
      for(var lessonIndex in chapter.lessons) {
        var lesson = chapter.lessons[lessonIndex];
        if(lesson._id.toString() == lessonId) {           
          if(quiz) {
            if(!lesson.quiz) {
              lesson.quiz = {};
            }
            lesson.quiz.answers = attemptedAnswers;
          }
          if(lesson.status != 'completed') {
            lesson.status = state;
          }
          break;
        }
      }
    }
  }
  
  progress.markModified('chapters');
  progress.save(callback);
};

