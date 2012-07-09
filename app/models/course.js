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
var async = require('async');


var CourseSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  title: { type: String, index: true, trim: true, required: true },
  desc: { type: String },
  iconImage: { type: String },
  wallImage: { type: String },
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
  log.info("inside course save function");
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

mongoose.model('Course', CourseSchema);


var saveCourse = function (course, callback) {
  log.info("inside local save function");
  var now = new Date();
  var iconFileName = 'courseIconImage_' + course.id;
  var wallFileName = 'courseWallImage_' + course.id;
  var iconResizeDetail = {
    "width" : 200,
    "height" : 200
  };
  var wallResizeDetail = {
    "width" : 800,
    "height" : 450
  };

async.parallel([
  function(asyncCallback){

    // Process icon image
    log.info("start processing icon image");
    util.saveToDisk(course.iconImage, function(error, imagePath){
      if(error){
        log.error("Error comes from util - saveToDisk Function", error);
        asyncCallback(error);
      }

      var cropIconImageInfo = typeof(course.cropIconImgInfo) == 'undefined' ? '{ "x": 0, "y": 0, "x2": 200, "y2": 200, "h": 200, "w": 200}' : course.cropIconImgInfo;
      log.info("icon croping with data : ", cropIconImageInfo);
      util.imageCrop(imagePath, cropIconImageInfo, function(error, croppedImagePath) {
        if(error) {
          log.error("Error from Image crop opration", error);
          asyncCallback(error);
        }
        log.info("icon croped");

        // deletes old original file aftred crops
        fs.unlink(imagePath, function (error) {
          if (error) {
            log.error("Error from unlink file", error);
            asyncCallback(error);
          }
        });

        log.info("icon resizing");
        // resize croped file
        util.imageResize(croppedImagePath, iconResizeDetail, function(error, resizedImagePath){
          if(error){
            log.error("Image Resize opration", error);
            asyncCallback(error);
          }
          log.info("icon resized");
          var fileType = mime.extension(mime.lookup(resizedImagePath));

          // deletes old croped file after resize
          fs.unlink(croppedImagePath, function (error) {
            if (error) {
              log.error("Error from unlink file", error);
              asyncCallback(error);
            }
          });

          log.info("save icon to database");
          // fress resized image stores to database
          cdn.saveFileNew(iconFileName, resizedImagePath, fileType, function(error){
            if (error) {
              log.error("Error from save file in database", error);
              asyncCallback(error);
            }

            fs.unlink(resizedImagePath, function (error) {
              if (error) {
                log.error("Error from unlink file", error);
                asyncCallback(error);
              }
            });

            asyncCallback(null, '/cdn/' + iconFileName);
          });
        });
      });

    });

  }, function(asyncCallback){

    log.info("start processing wall image");
    // Process wall image
    util.saveToDisk(course.wallImage, function(error, imagePath){
      if(error){
        log.error("Error comes from util - saveToDisk Function", error);
        asyncCallback(error);
      }

      var cropWallImageInfo = typeof(course.cropWallImgInfo) == 'undefined' ? '{ "x": 0, "y": 0, "x2": 800, "y2": 450, "h": 450, "w": 800}' : course.cropWallImgInfo;
      log.info("wall croping with data : ", cropWallImageInfo);
      util.imageCrop(imagePath, cropWallImageInfo, function(error, croppedImagePath) {
        if(error) {
          log.error("Error from Image crop opration", error);
          asyncCallback(error);
        }
        log.info("wall croped");

        // deletes old original file aftred crops
        fs.unlink(imagePath, function (error) {
          if (error) {
            log.error("Error from unlink file", error);
            asyncCallback(error);
          }
        });

        log.info("wall resizing");
        // resize croped file
        util.imageResize(croppedImagePath, wallResizeDetail, function(error, resizedImagePath){
          if(error){
            log.error("Image Resize opration", error);
            asyncCallback(error);
          }
    
          log.info("wall resized");
          var fileType = mime.extension(mime.lookup(resizedImagePath));

          // deletes old croped file after resize
          fs.unlink(croppedImagePath, function (error) {
            if (error) {
              log.error("Error from unlink file", error);
              asyncCallback(error);
            }
          });

          log.info("wall saving to database");
          // fress resized image stores to database
          cdn.saveFileNew(wallFileName, resizedImagePath, fileType, function(error){
            if (error) {
              log.error("Error from save file in database", error);
              asyncCallback(error);
            }

            fs.unlink(resizedImagePath, function (error) {
              if (error) {
                log.error("Error from unlink file", error);
                asyncCallback(error);
              }
            });

            log.info("wall saved to database");
            asyncCallback(null, '/cdn/' + wallFileName);
          });
        });
      });

    });
  }], 
  function(error, imageNames){
    if(error){
      callback(error);
    }
    else{
      log.info(imageNames);
      course.iconImage = imageNames[0];
      course.wallImage = imageNames[1];
      callback();
    }
  })

/*
  // Process icon image
  util.saveToDisk(course.iconImage, function(error, imagePath){
    if(error){
      log.error("Error comes from util - saveToDisk Function", error);
      callback(error);
    }

    var cropIconImageInfo = typeof(course.cropIconImgInfo) == 'undefined' ? '{ "x": 0, "y": 0, "x2": 200, "y2": 200, "h": 200, "w": 200}' : course.cropIconImgInfo;
    util.imageCrop(imagePath, cropIconImageInfo, function(error, croppedImagePath) {
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
        cdn.saveFileNew(iconFileName, resizedImagePath, fileType, function(error){
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

          course.image = '/cdn/' + iconFileName;
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

  // Process wall image
  util.saveToDisk(course.wallImage, function(error, imagePath){
    if(error){
      log.error("Error comes from util - saveToDisk Function", error);
      callback(error);
    }

    var cropWallImageInfo = typeof(course.cropWallImgInfo) == 'undefined' ? '{ "x": 0, "y": 0, "x2": 200, "y2": 200, "h": 200, "w": 200}' : course.cropWallImgInfo;
    util.imageCrop(imagePath, cropWallImageInfo, function(error, croppedImagePath) {
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
        cdn.saveFileNew(wallFileName, resizedImagePath, fileType, function(error){
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

          course.image = '/cdn/' + wallFileName;
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
*/
};
