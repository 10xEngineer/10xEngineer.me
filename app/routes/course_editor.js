var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');

var async = require('async');
var jsyaml = require('js-yaml');
var _ = require('lodash');
var filed = require('filed');
var rimraf = require("rimraf");

var model = require('../models');
var importer = require('../helpers/importer');
var cdn = require('../helpers/cdn');
var util = require('../helpers/util');



/*********************************************
**********************************************
**                                          **
**  Course Operations                       **
**                                          **
**********************************************
*********************************************/


/************************************
** Show Main Page of Course Editor **
************************************/
module.exports.coursesList = function(req, res){
  var Course = model.Course;

  Course.find({})
    .populate('created_by')
    .exec(function(error, courses) {
      res.render('course_editor', {
        courses : courses,
        user: req.user
      });
  });
};

/************************************
** Create course view              **
************************************/
module.exports.createView = function(req, res){
  res.render('course_editor/course/create', {
    title: 'New Course',
    course: {_id:'',title:'',description:''}
  });
};

/************************************
** Submit created course           **
************************************/
module.exports.create = function(req, res, next){
  var Course = model.Course;

  var course = new Course();
  course.title = req.body.title;
  course.desc = req.body.description;
  course.iconImage = req.body.iconImage;
  course.cropIconImgInfo = req.body.cropIconImgInfo;
  course.wallImage = req.body.wallImage;
  course.cropWallImgInfo = req.body.cropWallImgInfo;
  course.created_by = req.user._id;

  // Saves Created Course
  course.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create course.";
      next(error);
    }

    var id = course.id;
    log.info("Course saved.");
    //Set the course info in the session to let socket.io know about it.
    req.session.newCourse = {title: course.title, _id: course._id};
    req.session.message = "Course created successfully.";
    res.redirect('/course_editor/course/' + id);
  });

};

/************************************
** Show a single course            **
************************************/
module.exports.course = function(req, res, next){

  res.render('course_editor/course', {
    title: req.course.title,
    chapter: undefined,
    index :0
  });
};

/************************************
** Show import course view         **
************************************/
module.exports.importView = function(req, res){
  res.render('course_editor/course/importView');
};

/************************************
** Submit imported course          **
************************************/
/*     Old Code  ----
module.exports.import = function(req, res, next) {

  var f = req.files['course-file'];

  // Read the uploaded file and parse it into a course structure
  var parsedCourse;
  try {
    parsedCourse = JSON.parse(fs.readFileSync(f.path, 'utf-8'));
  } catch (e) {
    log.error(e);
    req.session.error = "Can not import course.";
    //res.redirect('/course/import', {error: e});
  }

  // Create a new course based on the parsed file

  parsedCourse.created_by = req.user._id;
  importer.course(parsedCourse, function(error, course) {

    // Add chapters
    var chapters = parsedCourse.chapters;
    if(!chapters.length || chapters.length === 0) {
      res.redirect('/course_editor');
    }

    async.forEach(
      chapters,
      function(chapter, callback){
        importer.chapter(chapter, course._id, function(error, chapter, lessons) {
          if(error){
            callback(error);
          }
          async.forEach(
            lessons, 
            function(lesson, callbackInner) {
              importer.lesson(lesson, chapter._id, function(error){
                if(error){
                  callbackInner(error);
                }
                callbackInner();
              });
            },
            function(error){
              callback(error);
            }
          );
        });
      }, 
      function(error){
        next(error);
      }
    );
    // Success
    req.session.message = "Course sucessfully imported.";
    res.redirect('/course_editor');
  });
};
*/

/**************************************************
**   Edit / Update Course View                   **
**************************************************/
module.exports.updateView = function(req, res, next){
  res.render('course_editor/course/edit', {
    title: req.course.title
  });
};

/**************************************************
**  Submit updation of course                    **
**************************************************/
module.exports.update = function(req, res, next){
  var course = req.course;
  course.title = req.body.title;
  course.desc = req.body.description;
  course.image = req.body.image;

  course.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not updated course.";
    }
    req.session.message = "Course updated sucessfully.";
    res.redirect('/course_editor/course/' + course.id);
  });
};


module.exports.remove = function(req, res, next){
  var Progress = model.Progress;

  var course = req.course;
  var course_id = course._id;

  course.removeCourse(function(error){
    if (error) {
      log.error(error);
      req.session.error = "Can not remove course.";
    }
    Progress.removeCourseProgress(course_id, function(error){
      if(error) {
        log.error(error);
        req.session.error = "Can not remove course progress.";
        res.redirect('/course_editor/');
      }
      req.session.message = "Sucessfully course removed.";
      res.redirect('/course_editor');
    });
  });
};

// Publish a course
module.exports.publish = function(req, res) {
  var course = req.course;

  course.publish(true, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not published course.";
    }
    req.session.message = "Course published sucessfully.";
    res.redirect('/course_editor');
  });
};

// unpublish a course
module.exports.unpublish = function(req, res) {
  var course = req.course;
  
  course.publish(false, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not unpublished course.";
    }
    req.session.message = "Course unpublished sucessfully.";
    res.redirect('/course_editor');
  });

};

// Featured a course
module.exports.featured = function(req, res) {
  var course = req.course;
  course.setFeatured(true, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not featured course.";
    }
    req.session.message = "Course featured sucessfully.";
    res.redirect('/course_editor');
  });
};

// Unfeatured a course
module.exports.unfeatured = function(req, res) {
  var course = req.course;
  
  course.setFeatured(false, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not unfeatured course.";
    }
    req.session.message = "Course unfeatured sucessfully.";
    res.redirect('/course_editor');
  });
};


/*********************************************
**                                          **
**  Chapter Operations                      **
**                                          **
*********************************************/

module.exports.chapterView = function (req, res) {
  res.render('course_editor/chapter', {
    title: req.chapter.title
  });
};

module.exports.chapterEditView = function(req, res) {
  res.render('course_editor/chapter/edit', {
    title: req.chapter.title
  });
};

// Save edited chapter
module.exports.chapterEdit = function(req, res){
  var chapter = req.chapter;

  chapter.title = req.body.title;
  chapter.desc = req.body.description;

  chapter.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not updated chapter.";
    }
    req.session.message = "Chaper updated sucessfully.";
    res.redirect('/course_editor/chapter/' + chapter.id);
  });
};


// Create new chapter form
module.exports.chapterCreateView = function(req, res){
  res.render('course_editor/chapter/create', {
    title: 'New Chapter',
    chapter: {id: '', title: ''}
  });
};

// Create a new chapter
module.exports.chapterCreate = function(req, res){
  var Chapter = model.Chapter;

  var chapter = new Chapter();
  chapter.title = req.body.title;
  chapter.desc = req.body.description;
  chapter.course = req.course._id;
  chapter.created_by = req.user.id;

  chapter.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create chapter.";
    }

    req.session.message = "Chaper created sucessfully.";
    res.redirect('/course_editor/course/' + req.course.id);
  });
};

module.exports.chapterRemove = function(req, res) {

  var chapter = req.chapter;
  var courseId =req.chapter.course.id;

  chapter.removeChapter(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not delete chapter.";
      res.redirect('/chapter/:id');
    }
    req.session.message = "Chaper deleted sucessfully.";
    res.redirect('/course_editor/course/'+ courseId);
  });
};

// Publish a chapter
module.exports.chapterPublish = function(req, res) {
  var chapter = req.chapter;

  chapter.publish(true, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not published chapter.";
    }
    req.session.message = "Chapter published sucessfully.";
    res.redirect('/course_editor/course/' + chapter.course.id);
  });
};

// unpublish a chapter
module.exports.chapterUnpublish = function(req, res) {
  var chapter = req.chapter;
  chapter.publish(false, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not unpublished chapter.";
    }
    req.session.message = "Chapter unpublished sucessfully.";
    res.redirect('/course_editor/course/' + chapter.course.id);
  });
};


// For Move up & Down Chapters

module.exports.chapterUp = function(req, res, next){
  var chapter = req.chapter;

  chapter.move(0, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved chapter.";
    }
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/course_editor/course/' + chapter.course.id);
  });
};

module.exports.chapterDown = function(req, res, next){
   var chapter = req.chapter;

  chapter.move(1, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved chapter.";
    }
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/course_editor/course/' + chapter.course.id);
  });
};


/*********************************************
**********************************************
**                                          **
**  Lession Operations                      **
**                                          **
**********************************************
*********************************************/
module.exports.lessonCreateView = function(req, res) {
  var VMDef = model.VMDef;

  VMDef.find(function (error, lab) {
    res.render('course_editor/lesson/lesson_create', {
      title: req.chapter.title,
      lesson: {title: '', desc: ''},
      edit: false,
      lab: lab
    }); 
  });
};

// Create a lesson
module.exports.lessonCreate = function(req, res, next) {
  var Lesson = model.Lesson;
  var VMDef = model.VMDef;

  var lesson = new Lesson();
  lesson.chapter = req.chapter._id;
  lesson.title   = req.body.title;
  lesson.desc    = req.body.description;
  lesson.type    = req.body.type;
  var f;

  // For Video Lesson
  if(lesson.type == 'video') {
    lesson.video.type    = req.body.videoType;
    lesson.video.content = req.body.videoContent;
    f = req.files.videofile;
    lesson.save(function(error) {
      if(error) {
        log.error(error);
        req.session.error = "Can not create lesson.";
      }
      var id = lesson.id;
      if(lesson.video.type == 'upload') {
        var fileName = 'lessonVideo_' + id;

        cdn.saveFile(fileName, f, function(error, fileName) {
          if(error) {
            log.error(error);
            next(error);
          }

          Lesson.findOne({ id: id }, function(error, lesson) {
            // Save the CDN URL if available
            lesson.video.content = fileName;
            lesson.save(function(error) {
              if(error) {
                log.error(error);
                next(error);
              }

              req.session.newLesson = {title: lesson.title, _id: lesson._id};
              req.session.message = "Lesson created successfully.";
              res.redirect('/course_editor/lesson/' + id);
            });
          });
        });
      } else {
        req.session.message = "Lesson created successfully.";
        res.redirect('/course_editor/lesson/' + id);
      }
    });
  }

  // For Programming Lesson
  if(lesson.type == 'programming') {
    lesson.programming.language = req.body.language ;
    lesson.programming.boilerPlateCode = req.body.boilerPlateCode ;
    saveLesson(lesson, req, res);
  }
  // For Quiz Lesson
  if(lesson.type == 'quiz') {

    lesson.quiz.marks = req.body.marks;
    /*
    // Old code
    var questionLength = req.body.question.length-1;
    var lessonInstanceQuestion = lesson.quiz.questions;
    for (var indexQuestion = 0; indexQuestion < questionLength; indexQuestion++) {        
      
      var instanceQuestion = {
        question : '',
        options  : [],
        answers  : []
      };

      instanceQuestion.question = req.body.question[indexQuestion];

      var optionsLength = req.body.questionOption[indexQuestion].length-1;
      var answerIndex = 0;
      for (var indexOption = 0; indexOption < optionsLength; indexOption++) {
        instanceQuestion.options[indexOption] = req.body.questionOption[indexQuestion][indexOption];
        if(req.body.questionOptionCheckbox[indexQuestion][indexOption]) {
          instanceQuestion.answers[answerIndex++] = req.body.questionOption[indexQuestion][indexOption];
        }
      }
      lessonInstanceQuestion.push(instanceQuestion);
    }
    saveLesson(lesson, req, res);
    // old code over
    */
    saveLesson(lesson, req, res);
  }

  // For sysAdmin Lesson
  if(lesson.type == 'sysAdmin') {
    f = req.files.verificationFile;
    var serverInfoArray = [];
    var vmTamplateIdList = req.body.serverName;
    var vmNameList = req.body.vmNames;
    var vmHostNameList = req.body.vmHostNames;
    var vms = [];
    if(typeof(vmTamplateIdList) == 'string') vmTamplateIdList = [vmTamplateIdList];
    if(typeof(vmNameList) == 'string') vmNameList = [vmNameList];
    if(typeof(vmHostNameList) == 'string') vmHostNameList = [vmHostNameList];

    VMDef.find({_id : { $in : vmTamplateIdList}}, function (error, lab) {
      for(var index = 0; index < vmTamplateIdList.length; index++) {
        var tmpJSON = {};
        tmpJSON.vm_name = vmNameList[index];
        tmpJSON.hostname = vmHostNameList[index];
        tmpJSON.ref = vmTamplateIdList[index];
        for(labIndex = 0; labIndex < lab.length; labIndex++) {
          if(vmTamplateIdList[index] == lab[labIndex]._id) {
            tmpJSON.vm_type = lab[labIndex].type;
            tmpJSON.runlist = lab[labIndex].runList;
            tmpJSON.vm_attrs = {};
            tmpJSON.vm_attrs.memory = lab[labIndex].memory;
            tmpJSON.vm_attrs.storage = lab[labIndex].storage;
          }
        }
        vms.push(tmpJSON);
      }
  
      var sysAdminConfig = {
        name : lesson.name,
        vms : vms
      };
     
      request({
        method: 'POST',
        uri: 'http://mc.10xengineer.me/def',
        multipart: 
          [ { 
              'content-type': 'application/json',
              body: sysAdminConfig
            }
          ] 
        },
        function (error, response, body) {
          // TODO : write code for save sysAdmin lesson using responce id and token
          lesson.sysAdmin.vms = response;
          saveLesson(lesson, req, res);

        });
    });
  }
};

var saveLesson = function(lesson, req, res){
  lesson.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create lesson.";
    }
    var id = lesson.id;
  
    req.session.newLesson = {title: lesson.title, _id: lesson._id};
    req.session.message = "Lesson created successfully.";
    res.redirect('/course_editor/lesson/' + id);
  });
};

var request = function(config, callback) {
  var actualObj = config.multipart[0].body.vms;
  callback(null, actualObj, config);
};

// Lesson Edit
module.exports.lessonEditView = function(req, res) {
  var VMDef = model.VMDef;

  var lesson = req.lesson;
  var answersJSON = {};
  if(lesson.type == 'quiz') {
    /*
    var quizQuestions = lesson.quiz.questions;
    var quizQuestionsLength = lesson.quiz.questions.length;

    for(var index = 0; index < quizQuestionsLength; index++) {
      if(!answersJSON[index]) {
        answersJSON[index] = {};
      }
      var answers = quizQuestions[index].answers;
      var options = quizQuestions[index].options;
      for (var indexOption = 0; indexOption < options.length; indexOption++) {
       if(_.indexOf(answers, options[indexOption]) !== -1) {
          answersJSON[index][options[indexOption]] = true;
        } else {
          answersJSON[index][options[indexOption]] = false;
        }
      }
    }*/
  }
  VMDef.find(function (error, lab) {
    res.render('course_editor/lesson/edit', {
      title: req.lesson.title,
      description: req.lesson.desc,
      answersJSON: answersJSON,
      edit: true,
      lab: lab,
      lesson : req.lesson
    });
  });
};

// Save edited chapter
module.exports.lessonEdit = function(req, res){
  var Lesson = model.Lesson;
  
  var lesson = req.lesson;
  lesson.title   = req.body.title;
  lesson.desc    = req.body.description;
  
  // For Video Lesson
  if(lesson.type == 'video') {
    lesson.video.type    = req.body.videoType;
    if(req.body.videoContent !== '') {
      lesson.video.content = req.body.videoContent;
    }
    if(req.files.videofile.name !== '' ) {
      var f = req.files.videofile;
    }
  }

  // For Programming Lesson
  if(lesson.type == 'programming') {
    lesson.programming.language = req.body.language ;
    lesson.programming.skeletonCode = req.body.code ;
    lesson.programming.input = req.body.input ;
    lesson.programming.output = req.body.output ;
  }
  // For Quiz Lesson
  if(lesson.type == 'quiz') {
    lesson.quiz.marks = req.body.marks;
  }

  // Sys Admin Lesson 
  if(lesson.type == 'sysAdmin'){
    var serverInfoArray = [];
    var serverName = req.body.serverName;
    lesson.sysAdmin.serverInfo = serverName;
    var f = req.files.videofile;
  }

  // Save edited lesson
  lesson.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create lesson.";
    }
    var id = lesson.id;
    if(lesson.type == 'video' && lesson.video.type == 'upload' && req.files.videofile.name !== '') {
      var fileName = 'lessonVideo_' + id;
      cdn.saveFile(fileName, f, function(error, fileName) {
        if(error) {
          log.error(error);
          next(error);
        }
        Lesson.findOne({ id: id }, function(error, lesson) {
          // Save the CDN URL if available
          lesson.video.content = fileName;
          lesson.save(function(error) {
            if(error) {
              log.error(error);
              next(error);
            }

            req.session.message = "Lesson edited successfully.";
            res.redirect('/course_editor/chapter/' + req.chapter.id);
          });
        });
      });
    } else {
      req.session.message = "Lesson edited successfully.";
      res.redirect('/course_editor/chapter/' + req.chapter.id);
    }
  });
};

module.exports.lessonRemove = function(req, res, next){

  var lesson = req.lesson;
  var Question = model.Question;
  var chapterId =lesson.chapter.id;
  var lesson_id = lesson._id;

  if(lesson.type == "quiz") {
    Question.remove({lesson: lesson_id}, function(err){
      if(err){
        log.error(err);
      }
    });
  }
  lesson.removeLesson(function(error){
    if (error) {
      log.error(error);
      req.session.error = "Can not remove lesson.";
      res.redirect('/course_editor/chapter/:id');
    }
    req.session.message = "Sucessfully lesson removed.";
    res.redirect('/course_editor/chapter/'+ chapterId);
  });
};

module.exports.lessonPublish = function(req, res) {
  
  var lesson = req.lesson;

  lesson.publish(true, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not published lesson.";
    }
    req.session.message = "Lesson published sucessfully.";
    res.redirect('/course_editor/chapter/' + lesson.chapter.id);
  });
};

// unpublish a lesson
module.exports.lessonUnpublish = function(req, res) {
  
  var lesson = req.lesson;
  
  lesson.publish(false, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not unpublished lesson.";
    }
    req.session.message = "Lesson unpublished sucessfully.";
    res.redirect('/course_editor/chapter/' + lesson.chapter.id);
  });
};

module.exports.lessonUp = function(req, res, next){
  
  var lesson = req.lesson;

  lesson.move(0, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved lesson.";
    }
    req.session.message = "Lesson moved sucessfully.";
    res.redirect('/course_editor/chapter/' + lesson.chapter.id);
  });
};

// for up or down lesson
module.exports.lessonDown = function(req, res, next){
  
  var lesson = req.lesson;

  lesson.move(1, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved lesson.";
    }
    req.session.message = "Lesson moved sucessfully.";
    res.redirect('/course_editor/chapter/' + lesson.chapter.id);
  });
};



module.exports.lessonView = function(req, res) {
  var VMDef = model.VMDef;
  var Question = model.Question;
  //For random the options
  var lesson = req.lesson;
  if(lesson.type=='sysAdmin'){
    VMDef.find({_id: { $in : lesson.sysAdmin.serverInfo}}, function(error, VMDeflist){
      res.render('course_editor/lesson/' + req.lesson.type, {
        lesson: lesson,
        labs : VMDeflist
      });
    });
  } else if(lesson.type=='quiz') {
    Question.find({ lesson: lesson._id }, function(err, questions) {
      console.log(questions);
      res.render('course_editor/lesson/' + req.lesson.type, {
        lesson : lesson,
        questions: questions
      });
    });
  } else {
    res.render('course_editor/lesson/' + req.lesson.type, {
      lesson : lesson
    });
  }
};

/*********************************************
**********************************************
**                                          **
**  Export Course                           **
**                                          **
**********************************************
*********************************************/

module.exports.exportCourse = function(req, res, next) {

  var Lesson    = model.Lesson;
  var course    = req.course;

  var course_dir = util.string.random(15);
  var data_course = '';
  data_course     = "title: " + course.title + "\n";
  data_course    += "desc: " + course.desc;
  exp_path        = 'app/upload';

  save_file_for_export(exp_path, course_dir, 'course', data_course, function(error){
    if(error){
      console.log(error);
      return next(error);
    } else {
      var chapters = course.chapters;
      var chap_path = exp_path + '/' + course_dir;
      var chap_count = 0;
      iconfile = course.iconImage.substring(5, course.iconImage.length);
      async.parallel([
        function(asyncParallelCB){
          // Icon image load
          load_resorces(exp_path+'/'+course_dir, 'icon', iconfile, function(err){
            if(err){
              console.log("Error...");
              return asyncParallelCB(error);
            }
            asyncParallelCB();
          });          
        },
        function(asyncParallelCB){
          // wall image load
          wallFile = course.wallImage.substring(5, course.wallImage.length);
          load_resorces(exp_path+'/'+course_dir, 'wall', wallFile, function(err){
            if(err){
              console.log("Error...");
              return asyncParallelCB(error);
            }
            asyncParallelCB();
          });
        },
        function(asyncParallelCB){
          // Loop for course's chapter
          async.forEachSeries(chapters, function(chap, callback){
            var data_chap = '';
            data_chap     = "title: " + chap.title + "\n";
            data_chap    += "desc: " + chap.desc;
            save_file_for_export(chap_path, 'chapter'+chap_count, 'chapter'+chap_count, data_chap, function(error){
              Lesson.find({_id : { $in : chap.lessons }}, function(error, lessons){
                var lesson_count = 0;

                // Loop for chapter's lessons
                async.forEachSeries(lessons, function(lesson, lessCB){
                  lesson_file_exp(chap_path, chap_count, lesson_count, lesson, function(error){
                    lesson_count++;
                    lessCB();
                  });


                }, function(err){
                  chap_count++;
                  callback();
                });
              });
            });
          }, function(error){
            if(error) {
              return asyncParallelCB(error);
            }
            return asyncParallelCB();
          });
        }], function(error){ // Callback of async parallel
          if(error){
            return next(error);
          }
          exp_path = path.resolve(exp_path);
          var zip    = spawn("zip",[ "-r", course_dir+".zip", course_dir], { cwd: exp_path });
          zip.stderr.on('data', function (data) {
            console.log('ZIP stderr: ' + data);
          });
          zip.on('exit', function (code) {
            res.setHeader('Content-Disposition', 'attachment; filename=' + course.title + '.zip');
            res.setHeader('Content-Type', 'application/zip');
            //res.setHeader('Content-Length', file.length);
            res.on('end', function() {
              console.log('Response Stream Ended.');
            });
            var reader = filed(exp_path+"/"+course_dir+".zip");
            reader.on('pipe', function() {
              console.log('piped');
            });
            reader.on('data', function(data) {
              console.log('data');
            });
            reader.on('end', function() {
              console.log('File Stream Ended.');
              console.log(exp_path+'/'+course_dir);
              rimraf(exp_path+'/'+course_dir, function(error){
                if(error) {
                  console.log(error);
                  return next(error);
                }
                next();
              });
            });
            console.log(reader);
            reader.pipe(res);
          });
      });
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
      data_lesson += "video: \n";
      var vtype = lesson.video.type;
      data_lesson += " type: "+vtype + "\n";
      if(vtype == "upload"){
        res = true;
        res_file = lesson.video.content;
        res_file = res_file.substring(5, res_file.length);
        res_file_name = res_file;
      }
      data_lesson += " content: "+lesson.video.content;
      break;
    case "programming":
      data_lesson += "programming: \n";
      data_lesson += " language: " + lesson.programming.language; 
      break;

  }

  save_file_for_export(full_path, 'lesson' +lesson_count, 'lesson'+lesson_count, data_lesson, function(error){
    full_path += '/lesson'+lesson_count;
    if(type == "programming") {
      fs.mkdir(full_path + "/resorces", function(err){
        fs.writeFile(full_path + "/resorces/boilerPlateCode.txt", lesson.programming.boilerPlateCode);
      });
    }
    if(res){
      load_resorces(full_path, res_file_name, res_file, callback);
    } else {
      callback();
    }
  });
};


/*********************************************
**********************************************
**                                          **
**  Import Course                           **
**                                          **
**********************************************
*********************************************/

module.exports.importCourse = function(req, res) {

  // UnZip imported file
  var file = req.files['course-file'];
  var random_dir = util.string.random(15);
  var imp_path = path.resolve("app/upload");
  fs.mkdir(imp_path+'/'+random_dir, function(){
    imp_path = path.resolve(imp_path+'/'+random_dir);
    var unzip    = spawn("unzip",[ file.path ], { cwd: imp_path });

    unzip.stdout.on('data', function (data) {
    });

    unzip.stderr.on('data', function (data) {
      console.log('UnZIP stderr: ' + data);
    });

    unzip.on('exit', function (code) {
      // Create course from imported course
      fs.readdir(imp_path, function(err, files){
        ext_dir = files[0];
        extract_course_from_imported_dir(imp_path+"/"+ext_dir, req.user, function(){
          rimraf(imp_path, function(err){
            console.log(err);
            res.redirect('/course_editor'); 
          });
        });
      });
    });
  });
};


var extract_course_from_imported_dir = function(course_dir, user, callback){
  var course_doc = require(course_dir+'/course.yml');
  fs.readdir(course_dir + '/resorces/', function(err, files){
    course_doc.iconImage = course_dir + '/resorces/' + files[0]; 
    course_doc.wallImage = course_dir + '/resorces/' + files[1]; 
    course_doc.created_by = user._id;
    importer.course(course_doc, function(err, doc){
      if(err){
        console.log(err);
      }
      else {
        extracts_chapters(course_dir, doc, callback);
      }
    });
  });
};

var extracts_chapters = function(course_dir, course, callback) {
  fs.readdir(course_dir, function(err, files){
    async.forEach(files, function(chapter, forEachCB){
      var regEx = new RegExp("^chapter");
      if(regEx.test(chapter)){
        chap_doc = require(course_dir+'/'+chapter+'/'+chapter+'.yml');
        importer.chapter(chap_doc, course._id, function(err, dbChap){
          extracts_lessons(course_dir+'/'+chapter, dbChap, forEachCB);
        });
      }
      else forEachCB();
    }, function(err){
      callback();
    });
  });
};

var extracts_lessons = function(chap_dir, chap, callback) {
  fs.readdir(chap_dir, function(err, files){
    async.forEach(files, function(lesson, forEachCB){
      var regEx = new RegExp("^lesson");
      if(regEx.test(lesson)){
        lesson_doc = require(chap_dir+'/'+lesson+'/'+lesson+'.yml');
        if(lesson_doc.type=="video"){
          extract_video_lesson(chap_dir, chap._id, lesson, lesson_doc, forEachCB);
        } else if(lesson_doc.type=="programming") {
          lesson_doc.programming['boilerPlateCode'] = chap_dir+'/'+lesson+'/resorces/boilerPlateCode.txt';
          importer.lesson(lesson_doc, chap._id, forEachCB);
        } else {
          forEachCB();
        }
      } else {
        forEachCB();
      }
    }, function(err) {
      callback();
    });
  });
};

var extract_video_lesson = function(chap_dir, chap_id, lesson, lesson_data, callback) {
  if(lesson_data.video.type == "upload"){
    fs.readdir(chap_dir+'/'+lesson+'/resorces/', function(err, files){
      lesson_data.video['path'] = chap_dir+'/'+lesson+'/resorces/'+files[0];
      return importer.lesson(lesson_data, chap_id, callback);
    });
  } else {
    return importer.lesson(lesson_data, chap_id, callback);
  }
};


