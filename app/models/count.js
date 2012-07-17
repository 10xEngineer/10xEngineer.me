var model = require('./index');
var CountSchema = require('./schema/count');

var statics = {
  getNext: function (type, callback) {
    this.collection.findAndModify({_id: type}, [['_id','asc']], {$inc: {count:1}}, {upsert: true, new: true}, function(error, result) { 
      if (error) {
        callback('Could not determine count for ' + type);
      }
      callback(null, result.count);
    });
  }
}


model.init('Count', CountSchema, {
  statics: statics
});
