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

module.exports.addChapter = function(chapter, callback) {
  var self = this;

  self.findById(chapter.course, function(error, course) {
    if(error) {
      callback(error);
    }

    if(typeof(course.chapters) != 'object') {
      course.chapters = [];
    }

    course.chapters.push({
      id: chapter._id,
      title: chapter.title,
      status: chapter.status
    });

    self.save(course, function(error) {
      if(error) {
        callback(error);
      }

      callback();
    });
  });
};

module.exports.updateChapter = function(chapter, callback) {
  var self = this;

  self.findById(chapter.course, function(error, course) {
    if(error) {
      callback(error);
    }

    for(var index in course.chapters) {
      var dbChapter = course.chapters[index];
      if(dbChapter.id === chapter._id) {
        dbChapter['title'] = chapter.title;
        dbChapter['status'] = chapter.status;

        course.chapters[index] = dbChapter;
        break;
      }
    }

    log.info(course);
    self.save(course, function(error) {
      if(error) {
        callback(error);
      }

      callback();
    });
  });
};

module.exports.removeChapter = function(chapter, callback) {
  var self = this;

  self.findById(chapter.course, function(error, course) {
    if(error) {
      callback(error);
    }

    for(var index in course.chapters) {
      var dbChapter = course.chapters[index];
      if(dbChapter.id === chapter._id) {
        
        course.chapters.splice(index - 1, 1);
        break;
      }
    }

    log.info(course);
    self.save(course, function(error) {
      if(error) {
        callback(error);
      }

      callback();
    });
  });
};

