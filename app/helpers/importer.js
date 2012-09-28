var model = require('../models');
var cdn = require('./cdn');
var mime = require('mime');
var fs = require('fs');
var async = require('async');
var path = require('path');
var spawn = require('child_process').spawn;
var rimraf = require("rimraf");

var util = require('./util');

module.exports = function() {};

var course = function(path, data, callback) {
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
      cdn.saveFileNew('courseIconImage_'+dbCourse.id, path +'/'+ data.iconImage, mime.lookup(path +'/'+ data.iconImage), function(err, iconImage){
        if (err) {
          console.log("Icon Image can't saved...");
          return callback(null, dbCourse);
        }
        else {
          cdn.saveFileNew('courseWallImage_'+dbCourse.id, path +'/'+ data.wallImage, mime.lookup(path +'/'+ data.wallImage), function(err, wallImage){
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

var chapter = function(data, courseId, callback) {
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

var lesson = function(data, chapterId, callback) {
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
    lesson.quiz.marks = data.quiz.marks;
    res = true;
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
        return callback(error);
      }
      callback();
    });
  } else {
    if(data.type == "video"){
      lesson.save(function(error) {
        if(error) {
          log.error(error);
          console.log("Can't save first time.");
          return callback(error);
        }
        var id = lesson.id;
        var fileName = 'lessonVideo_' + id;
        filePath  = data.video.path;
        console.log(filePath);
        cdn.saveFileNew(fileName, filePath, mime.lookup(filePath), function(error, fileName) {
          if(error) {
            console.log("Can't save at CDN.");
            log.error(error);
            return callback(error);
          }
          Lesson.findOne({ id: id }, function(error, lesson) {
            // Save the CDN URL if available
            lesson.video.content = fileName;
            lesson.save(function(error) {
              if(error) {
                console.log("Can't save second time.");
                log.error(error);
                return callback(error);
              }
              callback();
            });
          });
        });
      });
    } else if(data.type == "quiz"){
      lesson.save(function(error) {
        if(error) {
          log.error(error);
          return callback(error);
        }
        fs.readFile(data.quiz.questions, 'utf8', function(error, data){
          if(error) {
            log.error(error);
            return callback(error);
          }
          Lesson.findOne({id:lesson.id}, function(err, lesson){
            if(err){
              return callback(err);
            }
            data = JSON.parse(data);
            var Question = model.Question;
            async.forEach(data, function(questionInst, forEachCB){
              var question = new Question();
              question.lesson = lesson._id;
              question.question = questionInst.question;
              question.random = Math.random();
              question.points = questionInst.points;
              question.type = questionInst.type;
              question.answers = questionInst.answers;
              question.choices = questionInst.choices;
              question.save(forEachCB);
            }, function(err){
              if(err){
                console.log(err);
                return callback(err);
              }
              callback();
            });
          });
        });
      });
    } else if(data.type == "programming"){
      fs.readFile(data.programming.boilerPlateCode, function(err, data){
        if(err){
          return callback(err);
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
  var course_dir = util.string.random(15);
  var exp_path = 'app/upload';
  var iconFile = course.iconImage.substring(5, course.iconImage.length);
  var wallFile = course.wallImage.substring(5, course.wallImage.length);

  createDir(exp_path, course_dir, true, function(error){
    if(error) return next(error);
    async.parallel([

      // Task1 : collect icon image
      function(innerCallback) {
        copyFile(exp_path+'/'+course_dir+'/resources', iconFile, 'icon', function(error, icon_file){
          if(error) return innerCallback(error);
          iconFile = icon_file;
          innerCallback();
        });
      },

      // Task2 : Collect wall image
      function(innerCallback) {
        copyFile(exp_path+'/'+course_dir+'/resources', wallFile, 'wall', function(error, wall_file){
          if(error) return innerCallback(error);
          wallFile = wall_file;
          innerCallback();
        });
      },

      // Task3 : Chapters directory and fill that 
      function(innerCallback) {
        createDir(exp_path+'/'+course_dir, 'chapters', false, function(error, path){
          if(error) return innerCallback(error);
          exportsChapters(path, course, innerCallback);
        });
      }
    ], 
    // Final callback
    function(error){
      if(error) return next(error);

      // Creates Data for course
      var data;
      data = "title: " + course.title + "\n";
      data += "desc: " + course.desc + "\n";
      data += "iconImage: " + iconFile + "\n";
      data += "wallImage: " + wallFile;
      writeYML(exp_path+'/'+course_dir, 'course', data, function(error){
        if(error) return next(error);
        exp_path = path.resolve(exp_path);
        log.info("Course data dumped on disk", exp_path);
        fs.readdir(exp_path+'/'+course_dir, function(error, files){
          if(error){
            return next(error);
          }
          var args = [ "-r", course.title + ".zip"];
          args = args.concat(files);
          log.info("Compressing the exported data.");
          var zip = spawn("zip", args, { cwd: exp_path+'/'+course_dir });
          zip.stderr.on('data', function (data) {
            console.log('ZIP stderr: ' + data);
          });
          zip.on('exit', function (code) {
            log.info('Finished compressing course.');
            if(code != 0) {
              log.error("Error compressing file.");
            }
            return next(null, exp_path+'/'+course_dir, course.title);
          });
        });
      });
    });
  });
};

var createDir = function(path, dirName, res, callback) {
  var final_path = path+'/'+dirName;
  fs.mkdir(final_path, 0777, function(error){
    if(error) return callback(error);
    if(res){
      fs.mkdir(path+'/'+dirName+'/resources' , 0777, function(error){
        if(error) return callback(error);
        return callback(null, final_path);
      });
    } else return callback(null, final_path);
  });
};

var writeYML = function(path, name, data, callback) {
  fs.writeFile(path + '/' + name + '.yml', data, function (err) {
    if (err) {
      return callback(err);
    } 
    callback();
  });
};

var copyFile = function(path, dbName, name, callback) {
  cdn.copyToDisk(dbName, path, name, callback);
};

var exportsChapters = function(path, course, callback){
  var Lesson = model.Lesson;
  var index = 1;
  async.forEachSeries(course.chapters, 
    // Itrator of forEach
    function(chapter, forEachCB) {
      createDir(path, index, false, function(error, chapPath){
        async.parallel([
          // Task1: write YML file
          function(innerCallback){
            var data = "title: "+chapter.title+"\n";
            data += "desc: "+chapter.desc;
            writeYML(chapPath, 'chapter', data, innerCallback);
          },
          // Task2: load lessons
          function(innerCallback){
            Lesson.find({_id : { $in : chapter.lessons }}, function(error, lesson_list) {
              if(error) return innerCallback(error);
              if(lesson_list.length == 0) return innerCallback();
              sort_lessons(lesson_list, chapter.lessons, function(error, lessons) {
                if(error) return innerCallback(error);
                createDir(chapPath, 'lessons', false, function(error, lessonPath){
                  if(error) return innerCallback(error);
                  exportsLessons(lessonPath, chapter, lessons, innerCallback)
                });
              });
            });
          }],
          // parallel callback
          function(error){
            if(error) return forEachCB(error);
            index++;
            return forEachCB();
          });
      });
    }, 
    // For each callback
    callback
  );
}

var exportsLessons = function(path, chapter, lessons, callback) {
  var index = 1;
  async.forEachSeries(lessons, function(lesson, innerCallback){
    createDir(path, index, true, function(error, lessonPath){
      var data = "title: "+lesson.title+"\n";
      data += "desc: "+lesson.desc+"\n";
      data += "type: "+lesson.type+"\n";
      get_data_by_type(lessonPath, lesson, data, function(error, updated_data){
        if(error) return innerCallback(error);
        writeYML(lessonPath, 'lesson', updated_data, function(error){
          if(error) return innerCallback(error);
          index++;
          innerCallback(error);
        });
      });
    });
  }, callback);
}

var get_data_by_type = function(path, lesson, data, callback) {
  var type = lesson.type;
  switch(type){
    case "video":
      return exp_video(path, lesson, data, callback);
    case "programming":
      return exp_programming(path, lesson, data, callback);
    case "quiz":
      return exp_quiz(path, lesson, data, callback);
    default:
      return rimraf(path+'/resources', function(error){
        if(error) return callback(error);
        callback(null, data);
      });
  }
};

var exp_video = function(path, lesson, data, callback) {
  var vtype = lesson.video.type;
  var video_file = lesson.video.content;
  video_file = video_file.substring(5, video_file.length);

  data += "video: \n";
  data += "  type: "+vtype + "\n";
  if(vtype == "upload") { 
    copyFile(path+'/resources', video_file, 'lesson_video', function(error, name){
      if(error) callback(error);
      data += "  content: "+name;
      return callback(null, data);
    });
  } else {
    rimraf(path+'/resources', function(error){
      if(error) return callback(error);
      data += "  content: "+lesson.video.content;
      return callback(null, data);
    })
  }
};

var exp_programming = function(path, lesson, data, callback){
  data += "programming: \n";
  data += "  language: " + lesson.programming.language + "\n"; 
  fs.writeFile(path+'/resources/boilerPlateCode.txt', lesson.programming.boilerPlateCode, function(error){
    if(error) return callback(error);
    data += "  file: boilerPlateCode.txt\n";
    callback(null, data);
  });
}

var exp_quiz = function(path, lesson, data, callback) {
  var Question = model.Question;
  data += "quiz: \n";
  data += "  marks: " + lesson.quiz.marks + "\n"; 
  data += "  questions: questions.json";

  // Export questions at resourse file
  Question.find({"lesson": lesson._id}, function(error, question_list) {
    fs.appendFile(path + "/resources/questions.json", "[", function(){
      var frist = true;
      async.forEach(question_list, function(question, forEachCB){
        var data = "{";
        data += "\"question\" : " + JSON.stringify(question.question) + " , ";
        data += "\"type\" : \"" + question.type + "\" , ";
        data += "\"points\" : \"" + question.points + "\" , ";
        data += "\"choices\" : " + JSON.stringify(question.choices) + " , ";
        data += "\"answers\" : " + JSON.stringify(question.answers) + " }";
        (!frist) ? data = ", "+data : frist = false;
        fs.appendFile(path + "/resources/questions.json", data, forEachCB);
      }, function(error){
        return fs.appendFile(path + "/resources/questions.json", "]", function(error){
          if(error) return callback(error);
          return callback(null, data);
        });
      });
    });
  });
};

var sort_lessons = function(lessons, sequence, callback){
  if(lessons.length!=sequence.length){
    return callback('No of elements mismatch.');
  }
  var len = lessons.length;
  var sorted_lessons = [];
  for(var indx = 0; indx < len; indx++) {
    var lesson = lessons[indx];
    var _id    = lesson._id;
    var sorted_indx = sequence.indexOf(_id);
    sorted_lessons[sorted_indx] = lesson;
  }
  return callback(null, sorted_lessons);
}

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
    case "quiz":
      return quiz_lesson_exp(full_path, lesson, data_lesson, lesson_count, callback);
    default:
      return save_file_for_export(full_path, 'lesson'+lesson_count, 'lesson'+lesson_count, data_lesson, callback);
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
      return load_resources(full_path, 'video', res_file, callback);
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
    fs.mkdir(full_path + "/resources", function(err){
      if(err){
        return callback(err);
      }
      fs.writeFile(full_path + "/resources/boilerPlateCode.txt", lesson.programming.boilerPlateCode, function(err){
        if(err){
          return callback(err);
        }
        return callback();
      });
    });
  });
};

var quiz_lesson_exp = function(full_path, lesson, data, count, callback) {
  var Question = model.Question;
  data += "quiz: \n";
  data += " marks: " + lesson.quiz.marks + "\n"; 
  data += " questions: questions.json";

  save_file_for_export(full_path, 'lesson' +count, 'lesson'+count, data, function(error){
    if(error){
      return callback(error);
    }
    full_path += '/lesson'+count;
    fs.mkdir(full_path + "/resources", function(err){
      if(err){
        return callback(err);
      }

      // Export questions at resourse file
      Question.find({"lesson": lesson._id}, function(error, question_list){
        fs.appendFile(full_path + "/resources/questions.json", "[", function(){
          var frist = true;
          async.forEach(question_list, function(question, forEachCB){
            var data = "{";
            data += "\"question\" : " + JSON.stringify(question.question) + " , ";
            data += "\"type\" : \"" + question.type + "\" , ";
            data += "\"points\" : \"" + question.points + "\" , ";
            data += "\"choices\" : " + JSON.stringify(question.choices) + " , ";
            data += "\"answers\" : " + JSON.stringify(question.answers) + " }";
            (!frist) ? data = ", "+data : frist = false;
            fs.appendFile(full_path + "/resources/questions.json", data, forEachCB);
          }, function(error){
            return fs.appendFile(full_path + "/resources/questions.json", "]", callback);
          });
        });
      });
    });
  });
}

module.exports.importFullCourse = function(file, user, callback){
  var random_dir = util.string.random(15);
  var imp_path = path.resolve("app/upload");

  fs.mkdir(imp_path+'/'+random_dir, function(error){
    if(error) return callback(error);
    imp_path = path.resolve(imp_path+'/'+random_dir);
    log.info("Extracting course zip.");
    var unzip    = spawn("unzip",[ file.path ], { cwd: imp_path });

    unzip.stderr.on('data', function (data) {
      log.error('UnZIP stderr: ', data);
    });

    unzip.on('exit', function (code) {
      if(code != 0) {
        log.error('Error while extracting file.');
      }
      
      // Create course from imported course
      fs.readdir(imp_path, function(error, files){
        if(error) return callback(error);
        log.info("Importing course.");
        extract_course_from_imported_dir(imp_path, user, function(){
          log.info("Cleaning up.");
          rimraf(imp_path, function(err){
            if(err) {
              return callback(err);
            }
            return callback();
          });
        });
      });
    });
  });

};


var extract_course_from_imported_dir = function(course_dir, user, callback){
  var course_doc = require(course_dir+'/course.yml');
  var path = course_dir + '/resources';
  course_doc.created_by = user._id;
  course(path, course_doc, function(error, saved_course){
    if(error){
      console.log(error);
      return callback(error);
    }
    return extracts_chapters(course_dir, saved_course, callback);
  });
};

var extracts_chapters = function(course_dir, course, callback) {
  fs.readdir(course_dir+"/chapters", function(err, files){
    var index = 1;
    async.forEachSeries(files, function(chap, forEachCB){
      var regEx = new RegExp("^\\d+$");
      if(regEx.test(chap)) {
        chap_doc = require(course_dir+'/chapters/'+chap+'/chapter.yml');
        chapter(chap_doc, course._id, function(err, dbChap){
          // forEachCB();
          extracts_lessons(course_dir+'/chapters/'+chap, dbChap, forEachCB);
        });
      }
      else forEachCB();
    }, function(err){
      if(err){
        return callback(err);
      }
      return callback();
    });
  });
};

var extracts_lessons = function(chap_dir, chap, callback) {
  fs.readdir(chap_dir+'/lessons', function(err, files){
    async.forEachSeries(files, function(less, forEachCB){
      var regEx = new RegExp("^\\d+$");
      if(regEx.test(less)){
        lesson_doc = require(chap_dir+'/lessons/'+less+'/lesson.yml');
        if(lesson_doc.type=="video"){
          extract_video_lesson(chap_dir, chap._id, less, lesson_doc, forEachCB);
        } else if(lesson_doc.type=="programming") {
          lesson_doc.programming['boilerPlateCode'] = chap_dir+'/lessons/'+less+'/resources/boilerPlateCode.txt';
          lesson(lesson_doc, chap._id, forEachCB);
        } else if(lesson_doc.type=="quiz") {
          // TODO: Code for quiz
          lesson_doc.quiz.questions = chap_dir+'/lessons/'+less+'/resources/' + lesson_doc.quiz.questions;
          lesson(lesson_doc, chap._id, forEachCB);
        } else{
          forEachCB();
        }
      } else {
        forEachCB();
      }
    }, function(err) {
      if(err){
        return callback(err);
      }
      return callback();
    });
  });
};

var extract_video_lesson = function(chap_dir, chap_id, less, lesson_data, callback) {
  var regEx = new RegExp("^lesson_video");
  if(lesson_data.video.type == "upload"){
    fs.readdir(chap_dir+'/lessons/'+less+'/resources/', function(error, files){
      if(error) return callback(error);
      async.forEach(files, function(file, innerCB){
        if(regEx.test(file)){
          lesson_data.video['path'] = chap_dir+'/lessons/'+less+'/resources/'+file;
          lesson(lesson_data, chap_id, innerCB);
        }
      }, function(err){
        if(err){
          console.error(err);
          return callback(err);
        }
        callback();
      });
    });
  } else {
    return lesson(lesson_data, chap_id, callback);
  }
};
