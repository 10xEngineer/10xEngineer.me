var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var AssessmentSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  user: { type: ObjectId, ref: 'User' },
  test: { type: ObjectId, ref: 'Test' },
  score: { type: Number },
  attemptedDetails: [ AttemptSchema ]
 }, {
  collection: 'assessment'
});

var AttemptSchema = new Schema({
	question: { type: ObjectId, ref:'Question' },
	givenAns: [ { type: String } ],
  gotMarks: { type: Number }
});