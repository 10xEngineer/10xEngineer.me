var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');
var imageHelper = load.helper('image');

var CourseSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  image: { type: String },
  created_by: { type: ObjectId, ref: 'User' },
  status: { type: String, default: 'draft', enum: ['draft', 'punlished'], required: true },
  chapters: [{ type: ObjectId, ref: 'Chapter'}],
  created_at: { type: Date, default: Date.now, select: false },
  modified_at: { type: Date, default: Date.now, select: false }
}, {
  collection: 'courses'
});

// Set default id
CourseSchema.pre('save', function(next) {
  var course = this;
  if(!course.id) {
    Count.getNext('course', function(error, id) {
      course.id = id;
      next();
    })
  } else {
    next();
  }
});

CourseSchema.methods.removeCourse = function(callback) {
  // TODO: Remove all child chapters and lessons
  var course = this;

  course.remove(function(error) {
    if(error) {
      callback(error);
    }

    callback();
  });
};

mongoose.model('Course', CourseSchema);


var saveCourse = function (course, callback) {
  var now = new Date();
  var fileName = 'courseImage_' + course._id;

  // Process image
  imageHelper.save(course.image, fileName, function(error) {
    course.modified_at = now.getTime();
    course.users = [];
    course.save(function(error) {
      if(error) {
        callback(error);
      }

      callback(null, course);
    });
  });
};
