var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Count = new Schema({
  _id: { type: String, index: true, lowercase: true, trim: true },
  count: { type: Number }
}, {
  collection: 'count'
});

Count.statics.getNext = function (type, callback) {
  this.collection.findAndModify({_id: type}, [['_id','asc']], {$inc: {count:1}}, {upsert: true, new: true}, function(error, result) { 
    if (error) {
      callback('Could not determine count for ' + type);
    }
    callback(null, result.count);
  });
};

mongoose.model('Count', Count);
