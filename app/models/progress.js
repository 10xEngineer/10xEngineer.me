var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = load.model('Count');
var Course = load.model('Course');
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
  status: { type: String, enum: ['not-started', 'started', 'completed'], default: 'not-started'},
  progress: Number,
  lessons: [ LessonProgressSchema ]
});

var LessonProgressSchema = new Schema({
  _id: Number,
  id: Number,
  status: { type: String, enum: ['not-started', 'started', 'completed'], default: 'not-started'},
});


// Calculate Progress
CourseProgressSchema.pre('save', function(next) {
  var progress = this;

  // Load course
  Course.findById(progress.course)
    .populate('chapters')
    .run(function(error, course) {

    var chapters;

    if(progress.chapters && progress.chapters.length > 0) {
      chapters = progress.chapters;
    } else {
      chapters = course.chapters;
    }

    var chapterLength = chapters.length;
    for(var index = 0; index < chapterLength; index++) {
      var lessons = [];
      var lessonProgress = 0;
      var chapter = chapters[index];
      var pLessons = chapter.lessons;

      var saveChapter = _.after(pLessons.length, function() {
        var lessonProgress = _.reduce(pLessons, function(count, lesson) {
          if(lesson.status == 'completed') {
            return count++;
          } else {
            return count;
          }
        }, 0);

        progress.chapters.push({
          _id: chapter.id,
          id: chapter.id,
          seq: index,
          lessons: lessons,
          progress: lessonProgress / pLessons.length * 100
        });
      });

      _.each(pLessons, function(lesson, index) {
        Lesson.findById(lesson, function(error, lesson) {
          if(error) {
            next(error);
          }

          lessons.push({
            _id: lesson.id,
            id: lesson.id,
            seq: index
          });

          saveChapter();
        });
      });
    }

    var chapterProgress = _.reduce(progress.chapters, function(count, chapter) {
      if(chapter.status == 'completed') {
        return count++;
      } else {
        return count + (chapter.progress/100);
      }
    }, 0);

    progress.progress = chapterProgress;

    next();
  });
});


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

  var nextLesson = _.chain(chapters)
    .reduce(function(list, chapter) {
      log.info('reduce')
      var lessons = chapter.lessons;
      var lessonList = _.reduce(lessons, function(list, lesson) {
        if(lesson.status != 'completed') {
          var seq = chapter.seq * 1000 + lesson.seq;
          return list.concat({ seq: seq, id: lesson.id });
        } else {
          return list;
        }
      }, []);
      log.info(lessonList);
      return list.concat(lessonList);
    }, [])
    .sortBy(function(lesson) {
      return lesson.seq;
    }).value();

  log.info(nextLesson);
  callback(null, nextLesson.id);
};



mongoose.model('Progress', CourseProgressSchema);


