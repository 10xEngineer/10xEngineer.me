var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');
var Chapter = mongoose.model('Chapter');

var Chapter = load.model('Chapter');


var LessonSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String, trim: true },
  type: { type: String, enum: ['video', 'quiz', 'programming', 'config-lab'], required: true },
  video: {
    content: { type: String, trim: true },
    type: { type: String, enum: ['youtube', 'upload'] }
  },
  quiz: { type: Number },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
  chapter: { type: ObjectId, ref: 'Chapter', required: true },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now }
}, {
  collection: 'lessons'
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

LessonSchema.methods.removeLesson= function(callback) {
 
  var lesson = this;
  var chapter = lesson.chapter;
  
  log.info("Before Delete :",chapter.lessons);
  // For Remove Lession _Id from Chapter Table
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

  log.info('Chapter Lessons :',chapter.lessons);

  lesson.remove(function(error) {
    if(error) {
      callback(error);
    }
    callback();
  });
};

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

  var nextLessonId ='';
  var lesson = this;
  var chapterId = lesson.chapter;

  Chapter.findById(chapterId, function(error, chapter) {
    if(error) {
      log.error(error);
    }
    for (var i = 0; i < chapter.lessons.length; i++) {
      if(chapter.lessons[i].toString() == lesson._id.toString()) {

        // For last Lesson 
        if(i == (chapter.lessons.length-1)) {

        } else { 
          nextLessonId= chapter.lessons[i+1];
          
        }
        break;
      }
    }
    getLessonContent(nextLessonId,function(error ,nextLesson){
      if(error) {
        log.error(error);
      }
      callback(error, nextLesson.id); 
    }); 
  });

};

// For getPrevious Lesson
LessonSchema.methods.getPrevious = function(callback){

  var preLessonId ='';
  var lesson = this;
  var chapterId = lesson.chapter;

  Chapter.findById(chapterId, function(error, chapter) {
    if(error) {
      log.error(error);
    }
    for (var i = 0; i < chapter.lessons.length; i++) {
      if(chapter.lessons[i].toString() == lesson._id.toString()) {

        // For First Lesson 
        if(i == 0) {

        } else { 
          preLessonId= chapter.lessons[i-1];
               
        }
        break;
      }
    }
    getLessonContent(preLessonId,function(error ,preLesson){
      if(error) {
        log.error(error);
      }
      callback(error, preLesson.id); 
    });  
  });

};
  

mongoose.model('Lesson', LessonSchema);

var Lesson = load.model('Lesson');

var getLessonContent =function(LessonId,callback){
  Lesson.findById(LessonId, function(error, lessonContent) {
    if(error) {
      log.error(error);
    }
    callback(null, lessonContent);          
  });
};