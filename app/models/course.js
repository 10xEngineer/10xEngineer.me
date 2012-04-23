var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Count = mongoose.model('Count');

var Course = new Schema({
  _id: { type: Number, index: true, required: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  image: { type: String },
  created_by: { type: Number, ref: 'User' },
  status: { type: String, default: 'draft', enum: ['draft', 'punlished'], required: true },
  chapters: [{ type: Number, ref: 'Chapter'}],
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now }
});

// Set default id
Course.pre('save', function(next) {
  var course = this;
  if(!course._id) {
    Count.getNext('course', function(error, id) {
      course._id = id;
      next();
    })
  }
});


mongoose.model('Course', Course);

