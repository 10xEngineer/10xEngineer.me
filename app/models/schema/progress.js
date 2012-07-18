var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var CourseProgressSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  user: { type: ObjectId, ref: 'User' },
  course: { type: ObjectId, ref: 'Course' },
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing'},
  progress: Number,
  chapters: [ ChapterProgressSchema ]
}, {
  collection: 'progress'
});

var ChapterProgressSchema = new Schema({
  _id: { type: ObjectId },
  id: Number,
  seq: Number,
  status: { type: String, enum: ['not-started', 'ongoing', 'completed'], default: 'not-started', required: true },
  progress: Number,
  lessons: [ LessonProgressSchema ]
});

var LessonProgressSchema = new Schema({
  _id: { type: ObjectId },
  id: Number,
  status: { type: String, enum: ['not-started', 'ongoing', 'completed'], default: 'not-started'},
  quiz: {
    answers :{ type: {} }
  },
  videoProgress : { type: String}
});
