var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;


var LebDefSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  name: { type: String, index: true, trim: true, required: true },
  type: { type: String, trim: true },
  cpu: { type: Number, trim: true },
  memory: { type: Number, trim: true },
  storage: { type: Number, trim: true },
  runList : [ String ]
}, {
  collection: 'labDef'
});

mongoose.model('LabDef', LebDefSchema);