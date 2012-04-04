var db = require('../helpers/database').db;

module.exports = db.collection('courses');

module.exports.count = require('./count');

module.exports.findById = function (id, callback) {
  this.findOne({_id: id}, function(error, course){
    if(error) {
      callback(error);
    }

    callback(null, course);
  });
};

module.exports.get = function(filter, callback) {
  var selector = {};

  if(!filter || filter == {}) {
    selector['requires_verification'] = { $ne: true };
  }
  if(filter.category) {
    selector['category'] = filter.category;
  }

  this.find(selector).sort({created_at:-1}).toArray(callback);
};

module.exports.createNew = function (course, callback) {
  var self = this;

  this.count.getNext('course', function(error, id) {
    if(error) {
      callback(error);
    }

    var now = new Date();

    course['_id'] = id;
    course['created_at'] = now.getTime();
    course['modified_at'] = now.getTime();
    course['users'] = [];
    self.save(course, function(error) {
      if(error) {
        callback(error);
      }

      callback(null, course);
    });
  });
};

module.exports.removeById = function(id, callback) {
  this.remove({_id: parseInt(id)}, {}, callback);
};
