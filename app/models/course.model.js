var cdn = require('../helpers/cdn');

var model = require('./index');

var async = require('async');


var methods = {
  removeCourse: function(callback) {
    var course = this;

    function removeCourseImages(callback) {
      // Remove images
      cdn.unlinkFile(course.iconImage, function(error){
        if(error) return callback(error);

        cdn.unlinkFile(course.wallImage, function(error){
          if(error) return callback(error);
          course.remove(callback);
        });
      });
    }

    // Remove chapters of that course
    if(course.chapters.length>0) {
      course.chapters[0].removeAllChapterFromThisCourse(function(error){
        if(error) return callback(error);
        removeCourseImages(callback);
      });
    } else {
      removeCourseImages(callback);
    }
  },

  publish: function(publish, callback) {
    var course = this;
    if(publish) {
      var chaptersLength = course.chapters.length;

      async.forEach(course.chapters, function(chapterInst, innerCallback) {
        chapterInst.publish(true, innerCallback);
      }, function(error){
        if(error) return callback(error);

        course.status = 'published';
        course.markModified('chapters');
        course.save(callback);
      });
    } else {
      course.status = 'draft';
      course.markModified('chapters');
      course.save(callback);
    }
  },

  setFeatured: function(featured, callback) {
    var course = this;

    course.featured = featured;
    course.save(callback);
  }
};


module.exports = {
  name: 'Course',
  schema: require('./schema/course'),
  options: {
    methods: methods,
    plugins: ['id', 'timestamp', 'course']    
  }
};
