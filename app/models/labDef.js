
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;


var Count = mongoose.model('Count');

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

// Set default id
LebDefSchema.pre('save', function(next) {
  var labDef = this;
  
  labDef._wasNew = labDef.isNew;
  if(!labDef.id) {
    Count.getNext('labDef', function(error, id) {
      labDef.id = id;
      next();
    });
  } else {
    next();
  }
});

LebDefSchema.methods.removeLabDef= function(callback) {
  // TODO: Remove all child 
  var labDef = this;
 
  labDef.remove(function(error) {
    if(error) {
      callback(error);
    }
    callback();
  });
};


mongoose.model('LabDef', LebDefSchema);