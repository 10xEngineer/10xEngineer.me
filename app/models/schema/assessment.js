var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var AssessmentSchema = module.exports = new Schema({
  _id              : { type: ObjectId },
  user             : {
    id       : { type: ObjectId, ref: 'User' },
    name     : { type: String }
  },
  lesson           : {
    id       : { type: ObjectId, ref: 'Lesson' },
    title    : { type: String },
    marks    : { type: Number }
  },
  score            : { type: Number },
  attemptedDetails : [ AttemptSchema ],
  status           : { type: String, default: 'inProgress', enum: ['inProgress', 'attempted', 'inAssessing', 'assessed'], required: true },
 }, {
  collection: 'assessment'
});

var AttemptSchema = new Schema({
	question : { type: ObjectId, ref:'Question' },
	givenAns : [ { type: String } ],
  gotMarks : { type: Number },
  status   : { type: String}
});