var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var QuestionSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  lesson: { type: ObjectId, ref: 'Lesson' },
  question: { type: String},
  type: { type: String, enum: ['mcq', 'essay'], required: true },
  choices: [ { type: String} ],
  answers: [ {} ],
  points: {type: Number},
  random: {type: Number},
}, {
  collection: 'question'
});

