var async = require('async');
var _ = require('lodash');

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

      var chapters = [];

      if(progress.chapters && _.size(progress.chapters) > 0) {
        for(var chapt in progress.chapters){
          if(progress.chapters.hasOwnProperty(chapt)){
            chapters.push(progress.chapters[chapt]);
          }
        }

        var chapterIndex = 0;
        async.forEachSeries(chapters, function(chapter, chapterCallback) {

          var lessonProgress = 0;
          var lessonIndex = 0;
          var pLessons = [];
          for(var less in chapter.lessons){
            if(chapter.lessons.hasOwnProperty(less)){
              pLessons.push(chapter.lessons[less]);
            }
          }
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
          var chapArr = [];
          for(var chapt in progress.chapters){
            if(progress.chapters.hasOwnProperty(chapt)){
              chapArr.push(progress.chapters[chapt]);
            }
          }

          var chapterProgress = _.reduce(chapArr, function(count, chapter) {
            if(chapter.status == 'completed') {
              return ++count;
            } else {
              return count + (chapter.progress/100);
            }
          }, 0);
          if(chapArr.length > 0){
            progress.progress = chapterProgress / chapArr.length * 100;
          }
          if(progress.progress == 100) {
            progress.status = 'completed';
          }

          next();
        });

      } else {
        chapters = course.chapters;
        progress.chapters = {};

        var chapterIndex = 0;
        async.forEachSeries(chapters, function(chapter, chapterCallback) {

          var lessons = {};
          var lessonProgress = 0;
          var pLessons = chapter.lessons;
          var lessonIndex = 0;

          async.forEachSeries(pLessons, function(lesson, lessonCallback) {
            Lesson.findById(lesson, function(error, lesson) {
              if(error) {
                next(error);
              }

              lessons[lesson._id] = {
                _id    : lesson._id,
                id     : lesson.id,
                seq    : lessonIndex++,
                status : 'not-started'
              };

              lessonCallback();
            });
          }, function(error) {
            pLessons = [];
            for(var less in lessons){
              if(lessons.hasOwnProperty(less)){
                pLessons.push(lessons[less]);
              }
            }
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
            progress.chapters[chapter._id] = {
              _id       : chapter._id,
              id        : chapter.id,
              seq       : chapterIndex++,
              lessons   : lessons,
              progress  : lessonProgress,
              status    : 'not-started'
            };

            chapterCallback(error);
          });
        },
        function(error) {
          var chapArr = [];
          for(var chapt in progress.chapters){
            if(progress.chapters.hasOwnProperty(chapt)){
              chapArr.push(progress.chapters[chapt]);
            }
          }
          var chapterProgress = _.reduce(chapArr, function(count, chapter) {
            if(chapter.status == 'completed') {
              return ++count;
            } else {
              return count + (chapter.progress/100);
            }
          }, 0);
          if(chapArr.length > 0) {
            chapterProgress = chapterProgress / chapArr.length * 100;
          }
          
          progress.progress = chapterProgress;
          progress.status = 'ongoing';

          next();
        });
      }
    });
  });
};


