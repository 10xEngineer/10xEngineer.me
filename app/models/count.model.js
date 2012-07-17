var model = require('./index');

var statics = {
  getNext: function (type, callback) {
    this.collection.findAndModify({_id: type}, [['_id','asc']], {$inc: {count:1}}, {upsert: true, new: true}, function(error, result) { 
      if (error) {
        callback('Could not determine count for ' + type);
      }
      callback(null, result.count);
    });
  }
};

module.exports = {
  name: 'Count',
  schema: require('./schema/count'),
  options: {
    statics: statics
  }
};
