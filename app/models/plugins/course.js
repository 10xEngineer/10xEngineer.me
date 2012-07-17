var fs = require('fs');
var path = require('path')

var gm = require('gm');
var mime = require('mime');
var async = require('async');

var util = require('../../helpers/util');

module.exports = function(name) {
  return function(schema, options) {
    schema.pre('save', function(next) {
      var course = this;
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

  };
};


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
