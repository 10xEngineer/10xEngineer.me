var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Count = mongoose.model('Count');
var Course = mongoose.model('Course');

var Chapter = new Schema({
  _id: { type: Number, index: true, required: true },
  title: { type: String, index: true, trim: true, required: true },
  status: { type: String, default: 'draft', enum: ['draft', 'punlished'], required: true },
  course: { type: Number, ref: 'Course', required: true },
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now }
}, {
  collection: 'chapters'
});

// Set default id
Chapter.pre('save', function(next) {
  var chapter = this;
  if(!chapter._id) {
    Count.getNext('chapter', function(error, id) {
      chapter._id = id;
      next();
    })
  }
});

Chapter.methods.publish = function(publish, callback) {
  var chapter = this;
  
  if(chapter.publish) {
    chapter.status = 'published';
  } else {
    chapter.status = 'draft';
  }

  this.save(callback);
};

mongoose.model('Chapter', Chapter);
