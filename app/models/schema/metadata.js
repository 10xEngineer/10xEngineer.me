var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var MetadataSchema = module.exports = new Schema({
  _id: { type: Number, default: 0 },
  schemaVersion: { type: Number, default: 1 }
}, {
  collection: 'metadata'
});
