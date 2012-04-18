var db = require('../helpers/database').db;

module.exports = db.collection('chapters');

var count = require('./count');
var course = require('./course');

module.exports.findById = function (id, callback) {
  this.findOne({_id: id}, function(error, chapter){
    if(error) {
      callback(error);
    }

    callback(null, chapter);
  });
};

module.exports.createNew = function (chapter, callback) {
  var self = this;

  count.getNext('chapter', function(error, id) {
    if(error) {
      callback(error);
    }

    var now = new Date();

    chapter['_id'] = id;
    chapter['created_at'] = now.getTime();
    chapter['modified_at'] = now.getTime();
    chapter['status'] = 'draft';
    self.save(chapter, function(error) {
      if(error) {
        callback(error);
      }

      // Update course
      course.addChapter(chapter, function(error) {
        callback(null, chapter);
      });
    });
  });
};

module.exports.publish = function(id, publish, callback) {
  var self = this;

  self.findById(id, function(error, chapter) {
    if(error) {
      callback(error);
    }

    if(!chapter) {
      callback('Chapter not found');
    }

    if(publish) {
      chapter['status'] = 'published';
    } else {
      chapter['status'] = 'draft';
    }
    
    self.save(chapter, function(error) {
      if(error) {
        callback(error);
      }

      // Update course
      course.updateChapter(chapter, function(error) {
        if(error) {
          callback(error);
        }

        callback(null, chapter);
      });
    });
  });
};

module.exports.removeChapter = function(id, callback) {
  var self = this;

  self.findById(id, function(error, chapter) {
    if(error) {
      callback(error);
    }

    course.removeChapter(chapter, function(error) {
      if(error) {
        callback(error);
      }

      self.remove({_id: id}, function(error) {
        if(error) {
          callback(error);
        }

        callback();
      });
    });
  });
};