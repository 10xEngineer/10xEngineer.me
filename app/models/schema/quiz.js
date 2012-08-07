var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var QuizSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  mark: { type: Number },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
}, {
  collection: 'quiz'
});
