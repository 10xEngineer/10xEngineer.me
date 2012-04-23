var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Count = mongoose.model('Count');
var imageHelper = load.helper('image');

var CourseSchema = new Schema({
  _id: { type: Number, index: true, required: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  image: { type: String },
  created_by: { type: Number, ref: 'User' },
  status: { type: String, default: 'draft', enum: ['draft', 'punlished'], required: true },
  chapters: [{ type: Number, ref: 'Chapter'}],
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now }
}, {
  collection: 'courses'
});

// Set default id
CourseSchema.pre('save', function(next) {
  var course = this;
  if(!course._id) {
    Count.getNext('course', function(error, id) {
      course._id = id;
      next();
    })
  }
});

CourseSchema.statics.createOrUpdate = function(course, callback) {
  var self = this;

  if(course._id) {
    // Update
    saveCourse(course, callback);
  } else {
    count.getNext('course', function(error, id) {
      if(error) {
        callback(error);
      }

      var now = new Date();

      course['_id'] = id;
      course['created_at'] = now.getTime();
      saveCourse(course, callback);
    });
  }
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
