var async = require('async');
var _ = require('underscore');

var model = require('./index');
var CourseProgressSchema = require('./schema/progress');


var statics = {
  userChapterProgress: function(user, callback) {
    var Progress = this;

    Progress.find({ user: user._id })
      .populate('course')
      .run(function(error, progress) {
      if(error) {
        callback(error);
      }
      callback(null, progress);
    });
  },

  startOrContinue: function(user, course, callback) {
    var Progress = this;

    Progress.findOne({ user: user._id, course: course._id }, function(error, progress) {
      if(error) {
        callback(error);
      }

      if(!progress) {
        // Sign the user up for current course
        progress = new Progress();
        progress.user = user;
        progress.course = course;
        progress.save(function(error) {
          if(error) {
            callback(error);
          }
          callback(null, progress);
        });
      } else {
        callback(null, progress);
      }
    });
  },

  removeCourseProgress: function(course_Id, callback) {
    Progress = this;

    Progress.remove({course:course_Id}, function(error) {
      if(error) {
        callback(error);
      }
      callback();
    });

  }
};

var methods {
  getNextLesson: function(callback) {
    var progress = this;

    // TODO: Iterate through all the modules and lessons -> Find a lesson, which isn't completed having the least sequence number
    var chapters = progress.chapters;

    var combinedChapters = _.reduce(chapters, function(list, chapter) {
      var lessons = chapter.lessons;

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

    var nextLesson = sortedChapters[0];

    callback(null, nextLesson.id);
  },

  startLesson: function(lessonJSON, callback) {
    var progress = this;
    chapterId = lessonJSON.chapter;
    lessonId  = lessonJSON.lesson;
    for (var chapterIndex in progress.chapters) {
      var chapter = progress.chapters[chapterIndex];
      if(chapter.id == chapterId){
        for(var lessonIndex in chapter.lessons) {
          var lesson = chapter.lessons[lessonIndex];
          if(lesson.id == lessonId) {
            lesson.status = 'ongoing';
            break;
          }
        }
      }
    }
    progress.markModified('chapters');
    progress.save(function(error) {
      if(error) {
        callback(lesson, error);
      }
      callback(lesson);
    });
  },

  completeLesson: function(lessonJSON, callback) {
    var progress = this;
    chapterId = lessonJSON.chapter;
    lessonId  = lessonJSON.lesson;
    for (var chapterIndex in progress.chapters) {
      var chapter = progress.chapters[chapterIndex];
      if(chapter.id == chapterId){
        for(var lessonIndex in chapter.lessons) {
          var lesson = chapter.lessons[lessonIndex];
          if(lesson.id == lessonId) {
            if(lessonJSON.quiz) {
              if(!lesson.quiz) {
                lesson.quiz = {};
              }
              lesson.quiz.answers = lessonJSON.quiz;
            }
            lesson.status = 'completed';
            break;
          }
        }
      }
    }
    progress.markModified('chapters');
    progress.save(function(error) {
      if(error) {
        callback(error);
      }
      callback();
    });
  },

  updateProgress: function(lessonJSON, seconds, callback) {
    var progress = this;
    chapterId = lessonJSON.chapter;
    lessonId  = lessonJSON.lesson;
    for (var chapterIndex in progress.chapters) {
      var chapter = progress.chapters[chapterIndex];
      if(chapter.id == chapterId){
        for(var lessonIndex in chapter.lessons) {
          var lesson = chapter.lessons[lessonIndex];
          if(lesson.id == lessonId) {
            lesson.videoProgress = seconds;
            break;
          }
        }
      }
    }
    progress.markModified('chapters');
    progress.save(function(error) {
      if(error) {
        callback(error);
      }
      callback();
    });
  }
}


model.init('Progress', CourseProgressSchema, {
  plugins: ['timestamp', 'progress'],
  methods: methods,
  statics: statics
});

