var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var QuestionSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  test: { type: ObjectId, ref: 'Test' },
  question: String,
  choices: [ String ],
  answers: [ String ],
  waitage: Number,
  difficulty: Number
}, {
  collection: 'question'
});

