var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var ProgrammingSchema = module.exports = new Schema({
  _id: { type: ObjectId },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  boilerPlateCode: { type: String },
  language: { type: String },
}, {
  collection: 'programming'
});
