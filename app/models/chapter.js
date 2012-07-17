var async = require('async');
var mongoose = require('mongoose');

var Count = mongoose.model('Count');
var Course = mongoose.model('Course');

var ChapterSchema = require('./schema/chapter');


var chapterMethods = {
  publish: function(publish, callback) {
    var chapter = this;
    if(publish) {
      Chapter.findById(chapter._id)
      .populate('lessons')
      .run(function(error, chapter) {
        if(error) {
          callback(error, chapter);
        }
        var lessonsLength = chapter.lessons.length;
        for(var lessonIndex = 0 ; lessonIndex < lessonsLength ; lessonIndex++) {
          chapter.lessons[lessonIndex].status = "published";
          chapter.lessons[lessonIndex].save(function(error){
            if(error) {
              log.error(error);
            }
          });
        }
        chapter.status = 'published';
        chapter.markModified('lessons');

        chapter.save(function(error) {
          if(error) {
            log.error(error);
          }
 
          callback();
        });
      });

    } else {
      chapter.status = 'draft';
      chapter.save(function(error) {
        if(error) {
          log.error(error);
        }
        callback();
      });
    } 
  },

  removeChapter: function(callback) {
    // TODO: Remove all child 
    Chapter.findById(this._id).populate('lessons').run(function(error, chapter){

      chapter.lessons[0].removeAllLessonsFromThisChapter(function(error){
        if(error){
          callback(error)
        }

        // For Remove Chapter _Id from Course Table
        Course.findById(chapter.course, function(error, course){
          if (error) {
            callback(error);
          }

          for (var i = 0 ; i < course.chapters.length; i++) {
            if(course.chapters[i].toString() == chapter._id.toString()) {
              
              course.chapters.splice(i,1);
              
              course.markModified('chapters');
              course.save(function(error) {
                if(error) {
                  log.error(error);
                }
              });
            }
          }
        })

        chapter.remove(function(error) {
          if(error) {
            callback(error);
          }
          callback();
        });
      });      
    });
  },

  removeAllChapterFromThisCourse: function(callback) {

    var refChapter = this;

    Chapter.find({course:refChapter.course}).populate('lessons').run(function(error, chapters){
      if(chapters.length>0){
        async.forEach(
          chapters, 
          function(chapter, forEachCallback){
            chapter.lessons[0].removeAllLessonsFromThisChapter(function(error){
              if(error){
                forEachCallback(error);
              }
              forEachCallback();
            });
          },
          function(error){
            if(error){
              callback(error);
            }
            Chapter.remove({course:refChapter.course}, function(error){
              if(error){
                callback(error);
              }
              callback();
            });
          }
        );
      }
    });
  },

  // For Move Up & Down Chapter
  move: function(index, callback){

    var chapter = this ;
    var temp;
    var course = chapter.course;
    for (var i = 0 ; i < course.chapters.length; i++) {
      if(course.chapters[i].toString() == chapter._id.toString()) {
        if(index == 0) {
          if(i-1 >= 0) {
              temp = course.chapters[i];
              course.chapters[i] = course.chapters[i-1];
              course.chapters[i-1] = temp;
              break;
            }
        }  
        else if(index == 1) {
        
          if(i+1 <= course.chapters.length) {
              temp = course.chapters[i];
              course.chapters[i] = course.chapters[i+1];
              course.chapters[i+1] = temp;
          break;
            }
        }      
      }
    }
    course.markModified('chapters');
    course.save(callback);
  }
};


model.init('Chapter', ChapterSchema, {
  plugins: ['id', 'timestamp'],
  methods: chapterMethods,
  statics: chapterStatics
});

