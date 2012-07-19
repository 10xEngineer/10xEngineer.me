var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = module.exports = new Schema({
  _id: { type: String, index: true, lowercase: true, trim: true },
  count: { type: Number }
}, {
  collection: 'count'
});
