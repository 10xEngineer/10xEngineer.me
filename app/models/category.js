var db = require('../helpers/database').db;

module.exports = db.collection('category');

module.exports.count = require('./count');

module.exports.getAll = function (callback) {
  this.find().sort({name:1}).toArray(function(error, categories) {
    if(error) {
      callback(error);
    }

    callback(null, categories);
  });
};

module.exports.add = function (category, callback) {
  this.findOne({name: category}, function(error, dbCategory) {
    if (error) {
      return callback(error);
    }

    if(dbCategory) {
      callback(null, dbCategory);
    } else {
      this.count.getNext('category', function(error, id) {
        if (error) {
          return callback(error);
        }
        
        this.insert({_id: id, name: category}, {safe: true}, function(error, dbCategory){
          callback(null, dbCategory);
        });
      });
    }
  });
};