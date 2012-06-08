var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');
var cdn = load.helper('cdn');
var util = load.helper('util');
var fs = require('fs');
var path = require('path')
var gm = require('gm');
var mime = require('mime');


var CourseSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  image: { type: String },
  created_by: { type: ObjectId, ref: 'User' },
  status: { type: String, default: 'draft', enum: ['draft', 'published'], required: true },
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

      // Save image
      saveCourse(course, function(error) {
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

  course.remove(function(error) {
    if(error) {
      callback(error);
    }

    callback();
  });
};

mongoose.model('Course', CourseSchema);


var saveCourse = function (course, callback) {
  var now = new Date();
  var fileName = 'courseImage_' + course.id;

  // Process image
  util.saveToDisk(course.image, function(error, imagePath){
    if(error){
      log.error("Error comes from util - saveToDisk Function", error);
      callback(error);
    }
    util.imageCrop(imagePath, course.cropImgInfo, function(error, croppedImagePath) {
      if(error) {
        log.error("Error from Image crop opration", error);
        callback(error);
      }

      // deletes old original file aftred crops
      fs.unlink(imagePath, function (error) {
        if (error) {
          log.error("Error from unlink file", error);
          callback(error);
        }
      });

      // resize croped file
      util.imageResize(croppedImagePath, function(error, resizedImagePath){
        if(error){
          log.error("Image Resize opration", error);
          callback(error);
        }
  
        var fileType = mime.extension(mime.lookup(resizedImagePath));

        // deletes old croped file after resize
        fs.unlink(croppedImagePath, function (error) {
          if (error) {
            log.error("Error from unlink file", error);
            callback(error);
          }
        });

        // fress resized image stores to database
        cdn.saveFileNew(fileName, resizedImagePath, fileType, function(error){
          if (error) {
            log.error("Error from save file in database", error);
            callback(error);
          }

          fs.unlink(resizedImagePath, function (error) {
            if (error) {
              log.error("Error from unlink file", error);
              callback(error);
            }
          });

          course.image = '/cdn/' + fileName;
          course.save(function(error) {
            if(error) {
              callback(error);
            }
            callback();
          });
        });
      });
    });

  });

  /*  // old save replaced by new sequence of save
  cdn.save(course.image, fileName, function(error, newUrl) {
    course.image = newUrl;
    course.save(function(error) {
      if(error) {
        callback(error);
      }

      callback(null);
    });
  });
  */
};
