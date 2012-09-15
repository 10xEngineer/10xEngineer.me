var model = require('../models');
var cdn = require('./cdn');
var mime = require('mime');
var fs = require('fs');

var util = require('./util');

module.exports = function() {};

module.exports.course = function(data, callback) {
  var Course = model.Course;

  var course = new Course();
  course.title = data.title;
  course.desc = data.desc;
  course.iconImage = '/cdn/courseIconImage_';
  course.wallImage = '/cdn/courseWallImage_';
  course.created_by = data.created_by;

  var iconType, wallType;

  course.save(function(error) {
    if(error) {
      log.error(error);
      callback(error);
    }

    Course.findOne({ id: course.id }, function(error, dbCourse) {
      if(error) {
        log.error(error);
        callback(error);
      }
      cdn.saveFileNew('courseIconImage_'+dbCourse.id, data.iconImage, mime.lookup(data.iconImage), function(err, iconImage){
        if (err) {
          console.log("Icon Image can't saved...");
          return callback(null, dbCourse);
        }
        else {
          cdn.saveFileNew('courseWallImage_'+dbCourse.id, data.wallImage, mime.lookup(data.wallImage), function(err, wallImage){
            if(err){
              console.log("Not saved wall image");
              return callback(null, dbCourse);
            }
            dbCourse.iconImage = iconImage;
            dbCourse.wallImage = wallImage;
            dbCourse.save(function(err){
              if(err){
                console.log("Error in second time save.");
              }
              return callback(null, dbCourse);
            });
          });
        }
      });

    });
  });
};

module.exports.chapter = function(data, courseId, callback) {
  var Chapter = model.Chapter;

  var chapter = new Chapter();
  chapter.title = data.title;
  chapter.desc = data.desc;
  chapter.course = courseId;

  chapter.save(function(error) {
    if(error) {
      log.error(error);
      callback(error);
    }

    Chapter.findOne({ id: chapter.id }, function(error, dbChapter) {
      if(error) {
        log.error(error);
        callback(error);
      }

      callback(null, dbChapter, data.lessons);
    });
  });
};

module.exports.lesson = function(data, chapterId, callback) {
  var Lesson = model.Lesson;

  var lesson = new Lesson();
  lesson.title = data.title;
  lesson.desc = data.desc;
  lesson.chapter = chapterId;
  lesson.type = data.type;
  var res = false;
  if(data.type === 'video') {
    lesson.video.type = data.video.type;
    if(data.video.type == 'upload') {
      res = true;
    } else {
      lesson.video.content = data.video.content;
    }
  } else if(data.type === 'quiz') {
    lesson.quiz.questions = data.questions;
  } else if(data.type === 'programming') {
    lesson.programming.language = data.programming.language;
    res = true;
  } else if(data.type === 'sysAdmin') {
    // Not supported for now
  } else {
    // Not supported for now
  }

  if(!res){
    lesson.save(function(error) {
      if(error) {
        log.error(error);
        console.log("Can't save.");
        callback(error);
      }
      callback();
    });
  } else {
    if(data.type == "video"){
      lesson.save(function(error) {
        if(error) {
          log.error(error);
          console.log("Can't save first time.");
          callback(error);
        }
        var id = lesson.id;
        var fileName = 'lessonVideo_' + id;
        filePath  = data.video.path;
        cdn.saveFileNew(fileName, filePath, mime.lookup(filePath), function(error, fileName) {
          if(error) {
            console.log("Can't save at CDN.");
            log.error(error);
            callback(error);
          }
          Lesson.findOne({ id: id }, function(error, lesson) {
            // Save the CDN URL if available
            lesson.video.content = fileName;
            lesson.save(function(error) {
              if(error) {
                console.log("Can't save second time.");
                log.error(error);
                callback(error);
              }
              callback();
            });
          });
        });
      });
    } else if(data.type == "quiz"){
      // Not implemented yet
      callback();
    } else if(data.type == "programming"){
      fs.readFile(data.programming.boilerPlateCode, function(err, data){
        if(err){
          callback(err);
        }
        lesson.programming.boilerPlateCode = data;
        lesson.save(function(error) {
          if(error) {
            log.error(error);
            callback(error);
          }
          callback();
        });
      });
    } else if(data.type == "sysAdmin"){
      // Not implemented yet
      callback();
    }
  }
};


module.exports.usersFromUnbounce = function(userRow, callback) {
  var User = model.User;
  
  var fields = userRow.split(',');
  var email = fields[5];
  if(email && email !== 'email') {
    email = util.string.trim(email);

    User.findOne({email: email}, function(error, dbUser) {
      if (error) {
        return callback(error);
      }

      if(!dbUser) {
        user = new User();
        user.email = email;
        user.roles = ['default'];
        user.save(function(error){
          if(error) {
            return callback(error);
          }

          callback();
        });
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
}

module.exports.questions = function(quesitonRow, callback) {
  var Question = model.Question;
  
  var fields = quesitonRow.split('\t');
  // var email = fields[5];
  // if(email && email !== 'email') {
  //   email = util.string.trim(email);

  //   User.findOne({email: email}, function(error, dbUser) {
  //     if (error) {
  //       return callback(error);
  //     }

  //     if(!dbUser) {
  //       user = new User();
  //       user.email = email;
  //       user.roles = ['default'];
  //       user.save(function(error){
  //         if(error) {
  //           return callback(error);
  //         }

  //         callback();
  //       });
  //     } else {
  //       callback();
  //     }
  //   });
  // } else {
    callback();
  // }
}
