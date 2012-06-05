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
    type: { type: String, enum: ['youtube'] }
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
  
  if(lesson.publish) {
    lesson.status = 'published';
  } else {
    lesson.status = 'draft';
  }

  lesson.save(callback);
};

mongoose.model('Lesson', LessonSchema);


