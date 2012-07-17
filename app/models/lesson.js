var async = require('async');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');
var Chapter = mongoose.model('Chapter');
var Course = mongoose.model('Course');

var cdn = require('../helpers/cdn');

var LessonSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String, trim: true },
  type: { type: String, enum: ['video', 'quiz', 'programming', 'sysAdmin'], required: true },
  video: {
    content: { type: String, trim: true },
    type: { type: String, enum: ['youtube', 'upload'] }
  },
  quiz: { 
    questions : [ OptionSchema ],
  },
  programming:{
    language: { type: String, trim: true },
    skeletonCode: { type: String, trim: true },
    input: { type: String, trim: true },
    output: { type: String, trim: true }
  },
  sysAdmin:{
    serverInfo: [],
    verificationFile: { type: String, trim: true },
    vms : []
  },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
  chapter: { type: ObjectId, ref: 'Chapter', required: true },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now }
}, {
  collection: 'lessons'
});

var OptionSchema = new Schema({
  question: String,
  options: [ String ],
  answers: [ String ]
});

// Set default id
LessonSchema.pre('save', function(next) {
  var lesson = this;
  
  lesson._wasNew = lesson.isNew;
  if(!lesson.id) {
    Count.getNext('lesson', function(error, id) {
      lesson.id = id;
      next();
    });
  } else {
    next();
  }
});

LessonSchema.post('save', function() {
  var lesson = this;
  var id = parseInt(lesson.id.toString());

  // Add lesson to the chapter
  if (lesson._wasNew) {
    lesson.collection.findOne({ id: id }, function(error, lesson) {
      if(error) {
        log.error(error);
      }

      Chapter.findById(lesson.chapter, function(error, chapter) {
        if(error) {
          log.error(error);
        }

        chapter.lessons.push(lesson._id);

        chapter.save(function(error) {
          if(error) {
            log.error(error);
          }
        });
      });
    });
  }
});

LessonSchema.methods.removeLesson= function(callback) {
 
  var lesson = this;
  var chapter = lesson.chapter;
  
 
  // For Remove Lession _Id from Chapter Table
  Chapter.findById(chapter, function(error, chapter){
    for (var i = 0 ; i < chapter.lessons.length; i++) {
      if(chapter.lessons[i].toString() == lesson._id.toString()) {
        
        chapter.lessons.splice(i,1);
        
        chapter.markModified('lessons');
        chapter.save(function(error) {
          if(error) {
            log.error(error);
          }
        });
      }
    }

    if(lesson.type == "video" && lesson.video.type == "upload"){
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

  })
};

LessonSchema.methods.removeAllLessonsFromThisChapter = function(callback){

  var refLesson = this;

  Lesson.find({chapter:refLesson.chapter}, function(error, lessons){

    if(lessons.length>0){
      async.forEach(
        lessons,
        function(lesson, forEachCallback){
          if(lesson.type == "video" && lesson.video.type == "upload"){
            cdn.unlinkFile(lesson.video.content, function(error){
              if(error){
                forEachCallback(error);
              }
              forEachCallback();
            });
          }
          forEachCallback();
        },
        function(error){
          if(error){
            callback(error);
          }
          Lesson.remove({chapter: refLesson.chapter}, function(error){
            if(error){
              callback(error);
            }
            callback();
          });
        }
      );
    }
  });
}

LessonSchema.methods.publish = function(publish, callback) {
  var lesson = this;
  
  if(publish) {
    lesson.status = 'published';
  } else {
    lesson.status = 'draft';
  }
  lesson.save(callback);
};

// For Move Up & Down Lesson
LessonSchema.methods.move = function(index,callback){

  var lesson = this ;
  var temp;
  var chapter = lesson.chapter;
  for (var i = 0 ; i < chapter.lessons.length; i++) {
    if(chapter.lessons[i].toString() == lesson._id.toString()) {
      if(index == 0) {
        if(i-1 >= 0) {
            temp = chapter.lessons[i];
            chapter.lessons[i] = chapter.lessons[i-1];
            chapter.lessons[i-1] = temp;
            break;
          }
      }  
      else if(index == 1) {
      
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

};


// For getNext Lesson
LessonSchema.methods.getNext = function(callback){

  var nextLessonId = '';
  var flag         = true;
  var lesson       = this;
  var chapterId    = lesson.chapter;

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
    if(flag == false) {
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

};

// For getPrevious Lesson
LessonSchema.methods.getPrevious = function(callback){

  var preLessonId  = '';
  var flag         = true;
  var lesson       = this;
  var chapterId    = lesson.chapter;

  Chapter.findById(chapterId, function(error, chapter) {
    if(error) {
      log.error(error);
    }
    for (var i = 0; i < chapter.lessons.length; i++) {
      if(chapter.lessons[i].toString() == lesson._id.toString()) {

        // For First Lesson 
        if(i == 0) {
          flag = false;
        } else { 
          preLessonId= chapter.lessons[i-1];
          flag = true;  
        }
        break;
      }
    }
    if(flag == false) {
      getChapterContent('previous',chapter, function(error, preChapterId) {
        callbackFunction('previous',error, preChapterId, function(error, preLessonID) {
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

};
  

mongoose.model('Lesson', LessonSchema);

var Lesson = mongoose.model('Lesson');

var getLessonContent =function(lessonId,callback){
  Lesson.findById(lessonId, function(error, lessonContent) {
    if(error) {
      log.error(error);
    }
    callback(null, lessonContent);          
  });
};

var getChapterContent = function(index,chapter,callback) {
  
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
            if(i == (courseContent.chapters.length-1)) {
              moveChapterId= null; 
              flag = false;
            } else { 
              moveChapterId= courseContent.chapters[i+1]; 
              flag = true;       
            }
            break;
      
        } else if(index == 'previous') {

             // For first chapter 
            if(i == 0){
              moveChapterId= null; 
              flag = false;
            } else { 
              moveChapterId= courseContent.chapters[i-1]; 
              flag = true;       
            }
            break;

        }

      }
    } //end For 
    if(flag == false) {
      callback(null ,moveChapterId);
    } else if (flag == true) {
      callback(null ,moveChapterId);
    }
           
  });

};

var callbackFunction = function(index,error, moveChapterId,callback){
  if(error) {
    log.error(error);
  }

  if(moveChapterId == null) {
      callback(error, null);
  } else {
    
    Chapter.findById(moveChapterId, function(error, moveChapter) {
      
      if(error) {
        log.error(error);
      }
     
      moveLessonId = (moveChapter.lessons.length>0) ? moveChapter.lessons[0] : null ;

      if(moveLessonId == null) {
         
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