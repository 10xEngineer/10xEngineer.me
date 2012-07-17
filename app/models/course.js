var fs = require('fs');
var path = require('path')
var gm = require('gm');
var mime = require('mime');
var async = require('async');

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');

var cdn = require('../helpers/cdn');
var util = require('../helpers/util');


var CourseSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  iconImage: { type: String },
  wallImage: { type: String },
  created_by: { type: ObjectId, ref: 'User' },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
  featured: { type: Boolean, default: 'false' },
  chapters: [{ type: ObjectId, ref: 'Chapter'}],
  created_at: { type: Date, default: Date.now, select: false },
  modified_at: { type: Date, default: Date.now, select: false }
}, {
  collection: 'courses'
});

// Set default id
CourseSchema.pre('save', function(next) {
  var course = this;
  if(!course.id) {
    Count.getNext('course', function(error, id) {
      course.id = id;

      var regex = new RegExp('^/cdn/');
      var options = {processIcon: false, processWall: false};

      if(!regex.test(course.iconImage)) {
        options.processIcon = true;
      }
      if(!regex.test(course.wallImage)) {
        options.processWall = true;
      }

      log.info(options);

      // Save image
      processImages(course, options, function(error) {
        if(error) {
          next(error);
        }

        next();
      });
    });
  } else {
    next();
  }
});

CourseSchema.methods.removeCourse = function(callback) {
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
}

CourseSchema.methods.publish = function(publish, callback) {
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
};

CourseSchema.methods.setFeatured = function(featured, callback) {
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

mongoose.model('Course', CourseSchema);


var processImages = function (course, options, callback) {
  var now = new Date();
  var iconFileName = 'courseIconImage_' + course.id;
  var wallFileName = 'courseWallImage_' + course.id;
  var iconCropInfo = {
    "x": 0,
    "y": 0,
    "x2": 200,
    "y2": 200,
    "h": 200,
    "w": 200
  }
  var wallCropInfo = {
    "x": 0,
    "y": 0,
    "x2": 800,
    "y2": 450,
    "h": 450,
    "w": 800
  }
  var iconResizeInfo = {
    "w" : 200,
    "h" : 200
  };
  var wallResizeInfo = {
    "w" : 800,
    "h" : 450
  };

  var jobs = {};
  if(options.processIcon) {
    iconCropInfo = course.cropIconImgInfo || iconCropInfo;
    if(typeof(iconCropInfo) == 'string') {
      iconCropInfo = JSON.parse(iconCropInfo);
    }
    jobs['icon'] = imageJob(course.iconImage, iconFileName, {crop: iconCropInfo, resize: iconResizeInfo});
  }
  if(options.processWall) {
    wallCropInfo = course.cropWallImgInfo || wallCropInfo;
    if(typeof(wallCropInfo) == 'string') {
      wallCropInfo = JSON.parse(wallCropInfo);
    }
    jobs['wall'] = imageJob(course.wallImage, wallFileName, {crop: wallCropInfo, resize: wallResizeInfo});
  }

  async.parallel(jobs, function(error, results) {
    if(error){
      callback(error);
    }
    else{
      log.info(results);

      if(results.icon) {
        course.iconImage = results.icon;
      }
      if(results.wall) {
        course.wallImage = results.wall;
      }

      callback();
    }
  });
};


var imageJob = function(imageUrl, fileName, params) {

  return function(asyncCallback){

    // Process icon image
    util.saveToDisk(imageUrl, function(error, imagePath){
      if(error){
        log.error("Error comes from util - saveToDisk Function", error);
        asyncCallback(error);
      }

      util.processImage(imagePath, params, function(error, processedImagePath) {
        var fileType = mime.extension(mime.lookup(processedImagePath));

        cdn.saveFileNew(fileName, processedImagePath, fileType, function(error){
          if (error) {
            log.error("Error from save file in database", error);
            asyncCallback(error);
          }

          fs.unlink(processedImagePath, function (error) {
            if (error) {
              log.error("Error from unlink file", error);
              asyncCallback(error);
            }
          });

          asyncCallback(null, '/cdn/' + fileName);
        });
      });
    });
  };
}
