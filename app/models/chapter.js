var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');
var Course = mongoose.model('Course');

var ChapterSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String, trim: true },
  status: { type: String, default: 'draft', enum: ['draft', 'punlished'], required: true },
  course: { type: ObjectId, ref: 'Course', required: true },
  lessons: [{ type: ObjectId, ref: 'Lesson' }],
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now }
}, {
  collection: 'chapters'
});

// Set default id
ChapterSchema.pre('save', function(next) {
  var chapter = this;
  
  chapter._wasNew = chapter.isNew;
  if(!chapter.id) {
    Count.getNext('chapter', function(error, id) {
      chapter.id = id;
      next();
    });
  } else {
    next();
  }
});

ChapterSchema.post('save', function() {
  var chapter = this;
  var id = parseInt(chapter.id.toString());

  // Add chapter to the course
  if (chapter._wasNew) {
    chapter.collection.findOne({ id: id }, function(error, chapter) {
      if(error) {
        log.error(error);
      }

      Course.findById(chapter.course, function(error, course) {
        if(error) {
          log.error(error);
        }

        course.chapters.push(chapter._id);

        course.save(function(error) {
          if(error) {
            log.error(error);
          }
        });
      });
    });
  }
});

ChapterSchema.methods.publish = function(publish, callback) {
  var chapter = this;
  
  if(chapter.publish) {
    chapter.status = 'published';
  } else {
    chapter.status = 'draft';
  }

  chapter.save(callback);
};

mongoose.model('Chapter', ChapterSchema);


