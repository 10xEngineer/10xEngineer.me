var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var ChapterSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String, trim: true },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
  course: { type: ObjectId, ref: 'Course', required: true },
  lessons: [{ type: ObjectId, ref: 'Lesson' }]
}, {
  collection: 'chapters'
});
