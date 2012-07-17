var cdn = require('../helpers/cdn');

var model = require('./index');
var CourseSchema = require('./schema/course');


var methods = {
  removeCourse: function(callback) {
    // TODO: Remove all child chapters and lessons. Also remove any progress associated with it.
    
    var course = this;
    // Remove chapters of that course
    if(course.chapters.length>0){
      course.chapters[0].removeAllChapterFromThisCourse(function(error){
        if(error){
          callback(error);
        }

        // Remove images
        cdn.unlinkFile(course.iconImage, function(error){
          if (error) {
            callback(error);
          };
          cdn.unlinkFile(course.wallImage, function(error){
            if (error) {
              callback(error);
            };
            course.remove(function(error) {
              if(error) {
                callback(error);
              }
              callback();
            });
          });
        });
      });
    };

    // Remove images
    cdn.unlinkFile(course.iconImage, function(error){
      if (error) {
        callback(error);
      };
      cdn.unlinkFile(course.wallImage, function(error){
        if (error) {
          callback(error);
        };
        course.remove(function(error) {
          if(error) {
            callback(error);
          }
          callback();
        });
      });
    });
  },

  publish: function(publish, callback) {
    var course = this;
    if(publish) {
      var chaptersLength = course.chapters.length;
      for(var chapterIndex = 0 ; chapterIndex < chaptersLength ; chapterIndex++) {
        var chapter = course.chapters[chapterIndex];
        chapter.publish(true, function(error){
          if(error){
            log.error(error);
          }
        });
      }
      course.status = 'published';
    } else {
      course.status = 'draft';
    }
    course.markModified('chapters');
    course.save(function(error) {
      if(error) {
        log.error(error);
      }
      callback();
    });
  },

  setFeatured: function(featured, callback) {
    var course = this;

    course.featured = featured;
    course.save(function(error) {
      if(error) {
        log.error(error);
        callback(error);
      }
      callback();
    });
  };
};


model.init('Course', CourseSchema, {
  plugins: ['id', 'timestamp', 'course'],
  methods: methods
});

