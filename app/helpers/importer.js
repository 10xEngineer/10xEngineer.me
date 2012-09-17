var model = require('../models');
var cdn = require('./cdn');
var mime = require('mime');
var fs = require('fs');
var async = require('async');
var path = require('path');
var spawn = require('child_process').spawn;

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

module.exports.exportFullCourse = function(course, next){
  var Lesson    = model.Lesson;

  var course_dir = util.string.random(15);
  var data_course = '';
  data_course     = "title: " + course.title + "\n";
  data_course    += "desc: " + course.desc;
  exp_path        = 'app/upload';

  save_file_for_export(exp_path, course_dir, 'course', data_course, function(error){  // Saving Course Details to respected (.yml) file
    if(error){
      console.log(error);
      return next(error);
    } else {
      var chapters = course.chapters;
      var chap_path = exp_path + '/' + course_dir;
      var chap_count = 0;
      iconfile = course.iconImage.substring(5, course.iconImage.length);
      async.parallel([
        function(asyncParallelCB){                                                                                     // For Loading Icon Image
          // Icon image load
          log.info("Saving course images...");
          load_resorces(exp_path+'/'+course_dir, 'icon', iconfile, function(err){
            if(err){
              console.log("Error...");
              return asyncParallelCB(error);
            }
            asyncParallelCB();
          });          
        },
        function(asyncParallelCB){                                                                                     // For Loading Wall Image
          wallFile = course.wallImage.substring(5, course.wallImage.length);
          load_resorces(exp_path+'/'+course_dir, 'wall', wallFile, function(err){
            if(err){
              console.log("Error...");
              return asyncParallelCB(error);
            }
            asyncParallelCB();
          });
        },
        function(asyncParallelCB){                                                                                   // For Loading all chapters 
          log.info("Saving chapters...");
          async.forEachSeries(chapters, function(chap, chapForEachCB){                                               // Function for Each Chapter
            console.log("Chapter_Count :: "+chap_count);
            var data_chap = '';
            data_chap     = "title: " + chap.title + "\n";
            data_chap    += "desc: " + chap.desc;
            save_file_for_export(chap_path, 'chapter'+chap_count, 'chapter'+chap_count, data_chap, function(error){  // save chapter details to respected (.yml) file
              Lesson.find({_id : { $in : chap.lessons }}, function(error, lessons){                                  // Find and queue lessons of each chapter
                var lesson_count = 0;
                console.log("No of lessons found:: "+lessons.length);
                async.forEachSeries(lessons, function(lesson, lessCB){                                               // Function For each Lesson
                  console.log(lesson);
                  console.log("Process for lesson no. #"+lesson_count);
                  lesson_file_exp(chap_path, chap_count, lesson_count, lesson, function(error){
                    lesson_count++;
                    lessCB();
                  });
                }, function(err){                                                                                    // Function that called after complets all lessons of each chapter
                  chap_count++;
                  chapForEachCB();
                });
              });
            });
          }, function(error){                                                                                        // Function that called after complets all chapter
            if(error) {
              return asyncParallelCB(error);
            }
            return asyncParallelCB();
          });
        }], function(error){                                                                                         // Function that called after complets all parallel tasks
          if(error){
            return next(error);
          }
          exp_path = path.resolve(exp_path);
          log.info("Course data dumped on disk", exp_path);
          fs.readdir(exp_path+'/'+course_dir, function(error, files){
            if(error){
              return next(error);
            }
            var args = [ "-r", course.title+".zip"];
            args = args.concat(files);
            log.info("Compressing the exported data.");
            var zip = spawn("zip", args, { cwd: exp_path+'/'+course_dir });
            zip.stderr.on('data', function (data) {
              console.log('ZIP stderr: ' + data);
            });
            zip.on('exit', function (code) {
              if(code != 0) {
                log.error("Error compressing file.");
              }
              next(null, exp_path+'/'+course_dir, course.title);
            });
          });
        }
      );
    }
  });
};


/*  This save_file_for_export() function will do following
**  
**  - it creates directory with the name as given dir_name at given path
**  - then it creates file with the name as given file_name
**  - then write data to the file name
**  - and finally calls callback (with error if errors are there)
*/
var save_file_for_export = function(path, dir_name, file_name, data, callback){

  log.info("Dumping course metadata to file.");
  fs.mkdir(path + '/' + dir_name, 0777, function(error){
    if(error){
      return callback(error);
    }
    fs.writeFile(path + '/' + dir_name + '/' + file_name + '.yml', data, function (err) {
      if (err) {
        return callback(err);
      } 
      callback();
    });
  });
};

/*  This load_resorces function will do following
**
**  - create directory namely 'resorces' at given path if it's not exists
**  - store given file from database to that directory with the given file_name
**  - then calls callback
*/
var load_resorces = function(path, file_name, file, callback) {
  fs.mkdir(path + "/resorces", 0777, function(error){
    cdn.copyToDisk(file, path + "/resorces", file_name, function (){
      callback();
    });
  });
};

var lesson_file_exp = function(chap_path, chap_count, lesson_count, lesson, callback){
  // if(typeof(lesson)=='undefined'){
  //   throw new Error();
  // }
  var full_path = chap_path + '/chapter'+ chap_count;
  var type = lesson.type;
  var res = false;
  var res_file = '';
  var res_file_name = '';
  var data_lesson = '';
  data_lesson     = "title: " + lesson.title + "\n";
  data_lesson    += "desc: " + lesson.desc + "\n";
  data_lesson    += "type: " + type +"\n";

  switch(type) {
    case "video":
      return video_lesson_exp(full_path, lesson, data_lesson, lesson_count, callback);
    case "programming":
      return programming_lesson_exp(full_path, lesson, data_lesson, lesson_count, callback);
    default:
      return callback();
  }

};


var video_lesson_exp = function(full_path, lesson, data, count, callback) {
  var vtype = lesson.video.type;
  res_file = lesson.video.content;
  res_file = res_file.substring(5, res_file.length);

  data += "video: \n";
  data += " type: "+vtype + "\n";
  if(vtype == "upload"){
    data += " content: video";
  } else {
    data += " content: "+lesson.video.content;
  }
  save_file_for_export(full_path, 'lesson' +count, 'lesson'+count, data, function(error){
    full_path += '/lesson'+count;
    if(vtype=="upload"){
      load_resorces(full_path, 'video', res_file, callback);
      callback();
    }
    callback();
  });
};

var programming_lesson_exp = function(full_path, lesson, data, count, callback){
  data += "programming: \n";
  data += " language: " + lesson.programming.language; 
  save_file_for_export(full_path, 'lesson' +count, 'lesson'+count, data, function(error){
    if(error){
      return callback(error);
    }
    full_path += '/lesson'+count;
    fs.mkdir(full_path + "/resorces", function(err){
      fs.writeFile(full_path + "/resorces/boilerPlateCode.txt", lesson.programming.boilerPlateCode);
      callback();
    });
  });
};
