var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var QuestionSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  quiz: { type: ObjectId, ref: 'Quiz' },
  question: String,
  choices: [ String ],
  answers: [ String ],
  weightage: Number,
  random: Number,
  difficulty: Number
}, {
  collection: 'question'
});

