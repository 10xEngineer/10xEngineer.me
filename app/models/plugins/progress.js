var async = require('async');
var _ = require('underscore');

var model = require('../index');

module.exports = function(schema, options) {
  // Calculate Progress
  // TODO: Refactor and make it smaller
  schema.pre('save', function(next) {
    var Course = model.Course;
    var Lesson = model.Lesson;
    var progress = this;

    // Load course
    Course.findById(progress.course)
      .populate('chapters')
      .exec(function(error, course) {

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

          next();
        });
      }
    });
  });
};


