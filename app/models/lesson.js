var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');
var Chapter = mongoose.model('Chapter');

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

mongoose.model('Lesson', LessonSchema);
