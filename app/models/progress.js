var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var async = require('async');

var Count = load.model('Count');
var Course = load.model('Course');
var Chapter = load.model('Chapter');
var User = load.model('User');
var Lesson = load.model('Lesson');


var CourseProgressSchema = new Schema({
  _id: { type: ObjectId },
  user: { type: ObjectId, ref: 'User' },
  course: { type: ObjectId, ref: 'Course' },
  status: { type: String, enum: ['started', 'completed'], default: 'started'},
  progress: Number,
  chapters: [ ChapterProgressSchema ]
}, {
  collection: 'progress'
});

var ChapterProgressSchema = new Schema({
  _id: { type: Number },
  id: Number,
  seq: Number,
  status: { type: String, enum: ['not-started', 'started', 'completed'], default: 'not-started', required: true },
  progress: Number,
  lessons: [ LessonProgressSchema ]
});

var LessonProgressSchema = new Schema({
  _id: Number,
  id: Number,
  status: { type: String, enum: ['not-started', 'started', 'completed'], default: 'not-started'},
});


// Calculate Progress
// TODO: Refactor and make it smaller
CourseProgressSchema.pre('save', function(next) {
  var progress = this;

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

        log.info(pLessons.length);
        var lessonProgress = _.reduce(pLessons, function(count, lesson) {
          if(lesson.status == 'completed') {
            return count++;
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
            return count++;
          } else {
            return count + (chapter.progress/100);
          }
        }, 0);

        progress.progress = chapterProgress / chapters.length * 100;
        if(progress.progress == 100) {
          progress.status = 'completed';
        }

        next();
      });

    } else {
      chapters = course.chapters;

      var chapterIndex = 0;
      async.forEachSeries(chapters, function(chapter, chapterCallback) {

        var lessons = [];
        var lessonProgress = 0;
        var pLessons = chapter.lessons;
        var lessonIndex = 0;

        log.info(pLessons.length);
        async.forEachSeries(pLessons, function(lesson, lessonCallback) {
          log.info(lesson)
          Lesson.findById(lesson, function(error, lesson) {
            if(error) {
              next(error);
            }

            lessons.push({
              _id: lesson.id,
              id: lesson.id,
              seq: lessonIndex++,
              status: 'not-started'
            });

            log.info('lesson: ', lesson._id);
            lessonCallback();
          });
        }, function(error) {
          var lessonProgress = _.reduce(pLessons, function(count, lesson) {
            if(lesson.status == 'completed') {
              return count++;
            } else {
              return count;
            }
          }, 0);

          if(pLessons.length > 0) {
            lessonProgress = lessonProgress / pLessons.length * 100;
          }
          
          progress.chapters.push({
            _id: chapter.id,
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
            return count++;
          } else {
            return count + (chapter.progress/100);
          }
        }, 0);

        progress.progress = chapterProgress;
        progress.status = 'started';

        next();
      });
    }
  });
});

CourseProgressSchema.statics.userChapterProgress = function(user, callback) {
  var Progress = this;

  Progress.find({ user: user._id })
    .populate('course')
    .run(function(error, progress) {
    if(error) {
      callback(error);
    }
    callback(null, progress);
  });
};

CourseProgressSchema.statics.startOrContinue = function(user, course, callback) {
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
};

CourseProgressSchema.methods.getNextLesson = function(callback) {
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
};

CourseProgressSchema.methods.completeLesson = function(chapterId, lessonId, callback) {
  var progress = this;
  log.info(chapterId);

  for (var chapterIndex in progress.chapters) {
    var chapter = progress.chapters[chapterIndex];
    log.info(chapter.id, chapterId);
    if(chapter.id == chapterId){
      for(var lessonIndex in chapter.lessons) {
        var lesson = chapter.lessons[lessonIndex];
        log.info(lesson.id, lessonId);
        if(lesson.id == lessonId) {
          lesson.status = 'completed';
          break;
        }
      }
    }
  }

  log.info(progress);
  progress.save(function(error) {
    callback();
  });
}

mongoose.model('Progress', CourseProgressSchema);


