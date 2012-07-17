var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var CourseSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  iconImage: { type: String },
  wallImage: { type: String },
  created_by: { type: ObjectId, ref: 'User' },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
  featured: { type: Boolean, default: 'false' },
  chapters: [{ type: ObjectId, ref: 'Chapter'}]
}, {
  collection: 'courses'
});
