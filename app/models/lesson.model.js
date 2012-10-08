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
      if(error) return callback(error);

      chapter.lessons.splice(chapter.lessons.indexOf(lesson._id), 1);
      chapter.markModified('lessons');
      chapter.save(function(error) {
        if(error) return callback(error);

        if(lesson.type == "video" && lesson.video.type == "upload"){
          console.log(lesson);
          cdn.unlinkFile(lesson.video.content, function(error){
            if(error) return callback(error);
            lesson.remove(callback);
          });
        } else {
          lesson.remove(callback);
        }
      });
    });
  },

  removeAllLessonsFromThisChapter: function(callback){
    Lesson = model.Lesson;

    var refLesson = this;

    Lesson.find({chapter:refLesson.chapter}, function(error, lessons){
      if(error) return callback(error);

      if(lessons.length>0){
        async.forEach(lessons, function(lesson, forEachCallback){
          lesson.removeLesson(forEachCallback)
        }, callback);
      } else {
        callback();
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
    getLessonIdByDirection(this, 'next', callback);
  },

  // For getPrevious Lesson
  getPrevious: function(callback){
    getLessonIdByDirection(this, 'previous', callback);
  }
};

var getLessonContent =function(lessonId, callback){
  var Lesson = model.Lesson;

  Lesson.findById(lessonId, callback);
};

var getChapterContent = function(index, chapter, callback) {
  var Course = model.Course;

  var courseId = chapter.course;
  var nextCourse = '';
  var preCourse = '';
  var flag= true;
  
  Course.findById(courseId, function(error, courseContent) {
    if(error) return callback(error);

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

    callback(null, moveChapterId);
  });

};

var callbackFunction = function(index, moveChapterId, callback){
  var Chapter = model.Chapter;

  if(!moveChapterId) {
    return callback(new Error('Invalid ChapterId'));
  } else {
    Chapter.findById(moveChapterId, function(error, moveChapter) {
      if(error) return callback(error);
     
      moveLessonId = (moveChapter.lessons.length>0) ? moveChapter.lessons[0] : null ;

      if(!moveLessonId) {
         
        getChapterContent(index,moveChapter, function(error, moveChapterId) {
          if(error) return callback(error);

          process.nextTick(function() {
            callbackFunction(index, moveChapterId, callback);
          });
       });

      } else {
        
        getLessonContent(moveLessonId,function(error ,moveLesson){
          callback(error, moveLesson.id); 
        });
      }
    });
  }
};

var getLessonIdByDirection = function(lesson, direction, callback) {

  var lessonId  = '';
  var flag         = true;
  var chapterId    = lesson.chapter;
  var Chapter      = model.Chapter;

  Chapter.findById(chapterId, function(error, chapter) {
    if(error) return callback(error);

    for (var i = 0; i < chapter.lessons.length; i++) {
      if(chapter.lessons[i].toString() == lesson._id.toString()) {

        if(direction == 'previous') {
          // For First Lesson 
          if(i === 0) {
            flag = false;
          } else { 
            lessonId= chapter.lessons[i-1];
            flag = true;  
          }
          break;
        } else {
          // For last Lesson 
          if(i == (chapter.lessons.length-1)) {
            flag = false;
          } else { 
            lessonId = chapter.lessons[i+1]; 
            flag = true;       
          }
          break;
        }
      }
    }
    if(flag === false) {
      getChapterContent(direction, chapter, function(error, preChapterId) {
        if(error) return callback(error);
        if(preChapterId == null) return callback(null, null);
        callbackFunction(direction, preChapterId, callback);
      });
    } else {
      getLessonContent(lessonId,function(error ,preLesson){
        if(error) return callback(error);
        callback(error, preLesson.id); 
      });  
    }
  });
};


module.exports = {
  name: 'Lesson',
  schema: require('./schema/lesson'),
  options: {
    methods: methods,
    plugins: ['id', 'timestamp', 'lesson']  
  }
};
