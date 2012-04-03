var db = require('../helpers/database').db;


module.exports = db.collection('count');

module.exports.getNext = function (type, callback) {
  this.findAndModify({_id: type}, [['_id','asc']], {$inc: {count:1}}, {upsert: true, new: true}, function(error, result) { 
    if (error) {
      callback('Could not determine count for ' + type);
    }
    callback(null, result.count);
  });
};
