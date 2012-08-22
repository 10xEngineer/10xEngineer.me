var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var LessonSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String, trim: true },
  type: { type: String, enum: ['video', 'quiz', 'programming', 'sysAdmin'], required: true },
  video: {
    content: { type: String, trim: true },
    type: { type: String, enum: ['youtube', 'upload'] }
  },
  quiz: { 
    marks : { type: Number }
  },
  programming:{
    language: { type: String, trim: true },
    boilerPlateCode: { type: String, trim: true },
  },
  sysAdmin:{
    serverInfo: [],
    verificationFile: { type: String, trim: true },
    vms : []
  },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
  chapter: { type: ObjectId, ref: 'Chapter', required: true }
}, {
  collection: 'lessons'
});

var OptionSchema = new Schema({
  question: String,
  options: [ String ],
  answers: [ String ]
});
