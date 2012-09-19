var async = require('async');

var cdn = require('../helpers/cdn');

var model = require('./index');

var methods = {
  removeLesson: function(callback) {

    var Chapter = model.Chapter;
   
    var lesson = this;
    var chapter = lesson.chapter;
   
    // For Remove Lession _Id from Chapter Table
    Chapter.findById(chapter, function(error, chapter){

      if(error){
        callback(error);
      }

      chapter.lessons.splice(chapter.lessons.indexOf(lesson._id), 1);
      chapter.markModified('lessons');
      chapter.save(function(error) {

        if(error){
          callback(error);
        }

        if(lesson.type == "video" && lesson.video.type == "upload"){
          console.log(lesson);
          cdn.unlinkFile(lesson.video.content, function(error){
            if(error){
              callback(error);
            }
            lesson.remove(function(error) {
              if(error) {
                callback(error);
              }
              callback();
            });
          });
        }
        lesson.remove(function(error) {
          if(error) {
            callback(error);
          }
          callback();
        });
      });
    });
  },

  removeAllLessonsFromThisChapter: function(callback){
    Lesson = model.Lesson;

    var refLesson = this;

    Lesson.find({chapter:refLesson.chapter}, function(error, lessons){

      if(lessons.length>0){
        async.forEach(
          lessons,
          function(lesson, forEachCallback){
            lesson.removeLesson(forEachCallback)
          },
          function(error){
            if(error){
              return callback(error);
            }
            callback();
          }
        );
      }
    });
  },

  publish: function(publish, callback) {
    var lesson = this;
    
    if(publish) {
      lesson.status = 'published';
    } else {
      lesson.status = 'draft';
    }
    lesson.save(callback);
  },

  // For Move Up & Down Lesson
  move: function(index,callback){

    var lesson = this ;
    var temp;
    var chapter = lesson.chapter;
    for (var i = 0 ; i < chapter.lessons.length; i++) {
      if(chapter.lessons[i].toString() == lesson._id.toString()) {
        if(index === 0) {
          if(i-1 >= 0) {
              temp = chapter.lessons[i];
              chapter.lessons[i] = chapter.lessons[i-1];
              chapter.lessons[i-1] = temp;
              break;
            }
        }  
        else if(index === 1) {
        
          if(i+1 <= chapter.lessons.length) {
              temp = chapter.lessons[i];
              chapter.lessons[i] = chapter.lessons[i+1];
              chapter.lessons[i+1] = temp;
          break;
            }
        }      
      }
    }
    chapter.markModified('lessons');
    chapter.save(callback);

  },


  // For getNext Lesson
  getNext: function(callback){

    var nextLessonId = '';
    var flag         = true;
    var lesson       = this;
    var chapterId    = lesson.chapter;
    var Chapter      = model.Chapter;

    Chapter.findById(chapterId, function(error, chapter) {
      if(error) {
        log.error(error);
      }
      for (var i = 0; i < chapter.lessons.length; i++) {
        if(chapter.lessons[i].toString() == lesson._id.toString()) {

          // For last Lesson 
          if(i == (chapter.lessons.length-1)) {
            flag = false;
          } else { 
            nextLessonId = chapter.lessons[i+1]; 
            flag = true;       
          }
          break;
        }
      }
      if(flag === false) {
        getChapterContent('next',chapter, function(error, nextChapterId) {
          callbackFunction('next',error, nextChapterId, function(error, nextLessonID) {
            callback(error, nextLessonID); 
          });
        });
      } else {
        getLessonContent(nextLessonId,function(error ,nextLesson){
          if(error) {
            log.error(error);
          }
          callback(error, nextLesson.id); 
        }); 
      }
    });

  },

  // For getPrevious Lesson
  getPrevious: function(callback){

    var preLessonId  = '';
    var flag         = true;
    var lesson       = this;
    var chapterId    = lesson.chapter;
    var Chapter      = model.Chapter;

    Chapter.findById(chapterId, function(error, chapter) {
      if(error) {
        log.error(error);
      }
      for (var i = 0; i < chapter.lessons.length; i++) {
        if(chapter.lessons[i].toString() == lesson._id.toString()) {

          // For First Lesson 
          if(i === 0) {
            flag = false;
          } else { 
            preLessonId= chapter.lessons[i-1];
            flag = true;  
          }
          break;
        }
      }
      if(flag === false) {
        getChapterContent('previous', chapter, function(error, preChapterId) {
          callbackFunction('previous', error, preChapterId, function(error, preLessonID) {
            callback(error, preLessonID); 
          });
        });
      } else {
        getLessonContent(preLessonId,function(error ,preLesson){
          if(error) {
            log.error(error);
          }
          callback(error, preLesson.id); 
        });  
      }
    });
  }
};

var getLessonContent =function(lessonId, callback){
  var Lesson = model.Lesson;

  Lesson.findById(lessonId, function(error, lessonContent) {
    if(error) {
      log.error(error);
    }
    callback(null, lessonContent);          
  });
};

var getChapterContent = function(index, chapter, callback) {
  var Course = model.Course;

  var courseId = chapter.course;
  var nextCourse = '';
  var preCourse = '';
  var flag= true;
  
  Course.findById(courseId, function(error, courseContent) {
    if(error) {
      log.error(error);
    }
    for (var i = 0; i < courseContent.chapters.length; i++) {
      if(courseContent.chapters[i].toString() == chapter._id.toString()) {

        if(index == 'next') {
      
            // For last chapter 
            if(i == (courseContent.chapters.length - 1)) {
              moveChapterId = null; 
              flag = false;
            } else { 
              moveChapterId = courseContent.chapters[i + 1]; 
              flag = true;       
            }
            break;
      
        } else if(index == 'previous') {

             // For first chapter 
            if(i === 0){
              moveChapterId = null; 
              flag = false;
            } else { 
              moveChapterId = courseContent.chapters[i-1]; 
              flag = true;       
            }
            break;

        }

      }
    } //end For 
    if(flag === false) {
      callback(null ,moveChapterId);
    } else {
      callback(null ,moveChapterId);
    }
           
  });

};

var callbackFunction = function(index, error, moveChapterId, callback){
  var Chapter = model.Chapter;

  if(error) {
    log.error(error);
  }

  if(!moveChapterId) {
      callback("Chapter Id not specified.");
  } else {
    
    Chapter.findById(moveChapterId, function(error, moveChapter) {
      
      if(error) {
        log.error(error);
      }
     
      moveLessonId = (moveChapter.lessons.length>0) ? moveChapter.lessons[0] : null ;

      if(!moveLessonId) {
         
        getChapterContent(index,moveChapter, function(error, moveChapterId) {
          process.nextTick(function() {
            callbackFunction(index,error, moveChapterId, function(error, moveLessonID) {
               callback(error, moveLessonID); 
            });
          });
       });

      } else {
        
        getLessonContent(moveLessonId,function(error ,moveLesson){
          if(error) {
            log.error(error);
          }
          callback(error, moveLesson.id); 
        });
      }
    });
  }
};


module.exports = {
  name: 'Lesson',
  schema: require('./schema/lesson'),
  options: {
    methods: methods,
    plugins: ['id', 'timestamp', 'lesson']  
  }
};
