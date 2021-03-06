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
module.exports.coursesList = function(req, res, next){
  var Course = model.Course;
  if(typeof(req.user)=='undefined'){
    return res.redirect('/');
  }
  Course.find({})
    .populate('created_by')
    .exec(function(error, courses) {
      if(error) return next(error);
      res.render('course_editor', {
        courses : courses,
        user: req.user
      });
  });
};

/************************************
** Create course view              **
************************************/
module.exports.createView = function(req, res, next){
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
    if(error) return next(error);

    var id = course.id;

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
module.exports.importView = function(req, res, next){
  res.render('course_editor/course/importView');
};

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
    if(error) return next(error);
    req.session.message = "Course updated sucessfully.";
    res.redirect('/course_editor/course/' + course.id);
  });
};


module.exports.remove = function(req, res, next){
  var Progress = model.Progress;

  var course = req.course;
  var course_id = course._id;

  course.removeCourse(function(error){
    if(error) return next(error);
    Progress.removeCourseProgress(course_id, function(error){
      if(error) return next(error);
      req.session.message = "Sucessfully course removed.";
      res.redirect('/course_editor');
    });
  });
};

// Publish a course
module.exports.publish = function(req, res, next) {
  var course = req.course;

  course.publish(true, function(error) {
    if(error) return next(error);
    req.session.message = "Course published sucessfully.";
    res.redirect('/course_editor');
  });
};

// unpublish a course
module.exports.unpublish = function(req, res, next) {
  var course = req.course;
  
  course.publish(false, function(error) {
    if(error) return next(error);
    req.session.message = "Course unpublished sucessfully.";
    res.redirect('/course_editor');
  });

};

// Featured a course
module.exports.featured = function(req, res, next) {
  var course = req.course;
  course.setFeatured(true, function(error) {
    if(error) return next(error);
    req.session.message = "Course featured sucessfully.";
    res.redirect('/course_editor');
  });
};

// Unfeatured a course
module.exports.unfeatured = function(req, res, next) {
  var course = req.course;
  
  course.setFeatured(false, function(error) {
    if(error) return next(error);
    req.session.message = "Course unfeatured sucessfully.";
    res.redirect('/course_editor');
  });
};


/*********************************************
**                                          **
**  Chapter Operations                      **
**                                          **
*********************************************/

module.exports.chapterView = function (req, res, next) {
  res.render('course_editor/chapter', {
    title: req.chapter.title
  });
};

module.exports.chapterEditView = function(req, res, next) {
  res.render('course_editor/chapter/edit', {
    title: req.chapter.title
  });
};

// Save edited chapter
module.exports.chapterEdit = function(req, res, next){
  var chapter = req.chapter;

  chapter.title = req.body.title;
  chapter.desc = req.body.description;

  chapter.save(function(error) {
    if(error) return next(error);
    req.session.message = "Chaper updated sucessfully.";
    res.redirect('/course_editor/chapter/' + chapter.id);
  });
};


// Create new chapter form
module.exports.chapterCreateView = function(req, res, next){
  res.render('course_editor/chapter/create', {
    title: 'New Chapter',
    chapter: {id: '', title: ''}
  });
};

// Create a new chapter
module.exports.chapterCreate = function(req, res, next){
  var Chapter = model.Chapter;

  var chapter = new Chapter();
  chapter.title = req.body.title;
  chapter.desc = req.body.description;
  chapter.course = req.course._id;
  chapter.created_by = req.user.id;

  chapter.save(function(error) {
    if(error) return next(error);

    req.session.message = "Chaper created sucessfully.";
    res.redirect('/course_editor/course/' + req.course.id);
  });
};

module.exports.chapterRemove = function(req, res, next) {

  var chapter = req.chapter;
  var courseId =req.chapter.course.id;

  chapter.removeChapter(function(error) {
    if(error) return next(error);
    req.session.message = "Chaper deleted sucessfully.";
    res.redirect('/course_editor/course/'+ courseId);
  });
};

// Publish a chapter
module.exports.chapterPublish = function(req, res, next) {
  var chapter = req.chapter;

  chapter.publish(true, function(error) {
    if(error) return next(error);
    req.session.message = "Chapter published sucessfully.";
    res.redirect('/course_editor/course/' + chapter.course.id);
  });
};

// unpublish a chapter
module.exports.chapterUnpublish = function(req, res, next) {
  var chapter = req.chapter;
  chapter.publish(false, function(error) {
    if(error) return next(error);
    req.session.message = "Chapter unpublished sucessfully.";
    res.redirect('/course_editor/course/' + chapter.course.id);
  });
};


// For Move up & Down Chapters

module.exports.chapterUp = function(req, res, next){
  var chapter = req.chapter;

  chapter.move(0, function(error) {
    if(error) return next(error);
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/course_editor/course/' + chapter.course.id);
  });
};

module.exports.chapterDown = function(req, res, next){
   var chapter = req.chapter;

  chapter.move(1, function(error) {
    if(error) return next(error);
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
module.exports.lessonCreateView = function(req, res, next) {
  var VMDef = model.VMDef;

  VMDef.find(function (error, lab) {
    if(error) return next(error);
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
      if(error) return next(error);
      var id = lesson.id;
      if(lesson.video.type == 'upload') {
        var fileName = 'lessonVideo_' + id;

        cdn.saveFile(fileName, f, function(error, fileName) {
          if(error) return next(error);

          Lesson.findOne({ id: id }, function(error, lesson) {
            if(error) return next(error);
            // Save the CDN URL if available
            lesson.video.content = fileName;
            lesson.save(function(error) {
              if(error) return next(error);

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
      if(error) return next(error);
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
          saveLesson(lesson, req, res, next);

        });
    });
  }
};

var saveLesson = function(lesson, req, res, next){
  lesson.save(function(error) {
    if(error) return next(error);
    var id = lesson.id;
  
    req.session.newLesson = {title: lesson.title, _id: lesson._id};
    req.session.message = "Lesson created successfully.";
    res.redirect('/course_editor/lesson/' + id);
  });
};

var request = function(config, callback) {
  var actualObj;
  try {
    actualObj = config.multipart[0].body.vms;
  } catch(e) {
    return callback(e);
  }
  callback(null, actualObj, config);
};

// Lesson Edit
module.exports.lessonEditView = function(req, res, next) {
  var VMDef = model.VMDef;

  var lesson = req.lesson;
  var answersJSON = {};
  VMDef.find(function (error, lab) {
    if(error) return next(error);
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
module.exports.lessonEdit = function(req, res, next){
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
    if(error) return next(error);
    var id = lesson.id;
    if(lesson.type == 'video' && lesson.video.type == 'upload' && req.files.videofile.name !== '') {
      var fileName = 'lessonVideo_' + id;
      cdn.saveFile(fileName, f, function(error, fileName) {
        if(error) return next(error);
        Lesson.findOne({ id: id }, function(error, lesson) {
          if(error) return next(error);
          // Save the CDN URL if available
          lesson.video.content = fileName;
          lesson.save(function(error) {
            if(error) return next(error);

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

  function removeLesson() {
    lesson.removeLesson(function(error){
      if(error) return next(error);
      req.session.message = "Sucessfully lesson removed.";
      res.redirect('/course_editor/chapter/'+ chapterId);
    });
  }

  if(lesson.type == "quiz") {
    Question.remove({lesson: lesson_id}, function(error){
      if(error) return next(error);

      removeLesson();
    });
  } else {
    removeLesson();
  }
};

module.exports.lessonPublish = function(req, res, next) {
  
  var lesson = req.lesson;

  lesson.publish(true, function(error) {
    if(error) return next(error);
    req.session.message = "Lesson published sucessfully.";
    res.redirect('/course_editor/chapter/' + lesson.chapter.id);
  });
};

// unpublish a lesson
module.exports.lessonUnpublish = function(req, res, next) {
  
  var lesson = req.lesson;
  
  lesson.publish(false, function(error) {
    if(error) return next(error);
    req.session.message = "Lesson unpublished sucessfully.";
    res.redirect('/course_editor/chapter/' + lesson.chapter.id);
  });
};

module.exports.lessonUp = function(req, res, next){
  
  var lesson = req.lesson;

  lesson.move(0, function(error) {
    if(error) return next(error);
    req.session.message = "Lesson moved sucessfully.";
    res.redirect('/course_editor/chapter/' + lesson.chapter.id);
  });
};

// for up or down lesson
module.exports.lessonDown = function(req, res, next){
  
  var lesson = req.lesson;

  lesson.move(1, function(error) {
    if(error) return next(error);
    req.session.message = "Lesson moved sucessfully.";
    res.redirect('/course_editor/chapter/' + lesson.chapter.id);
  });
};



module.exports.lessonView = function(req, res, next) {
  var VMDef = model.VMDef;
  var Question = model.Question;
  //For random the options
  var lesson = req.lesson;
  if(lesson.type=='sysAdmin'){
    VMDef.find({_id: { $in : lesson.sysAdmin.serverInfo}}, function(error, VMDeflist){
      if(error) return next(error);
      res.render('course_editor/lesson/' + req.lesson.type, {
        lesson: lesson,
        labs : VMDeflist
      });
    });
  } else if(lesson.type=='quiz') {
    Question.find({ lesson: lesson._id }, function(error, questions) {
      if(error) return next(error);
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

  importer.exportFullCourse(req.course, function(error, path, title){
      if(error) return next(error);
      res.setHeader('Content-Disposition', 'attachment; filename=' + title + '.zip');
      res.setHeader('Content-Type', 'application/zip');
      res.on('end', function() {
        console.log('Response Stream Ended.');
      });
      var reader = filed(path+"/"+title+".zip");
      reader.on('end', function() {
        console.log('File Stream Ended.');
        console.log(path);
        rimraf(path, next);
      });
      log.info("Streaing file...");
      reader.pipe(res);
  });
};

/*********************************************
**********************************************
**                                          **
**  Import Course                           **
**                                          **
**********************************************
*********************************************/

module.exports.importCourse = function(req, res, next) {

  // UnZip imported file
  var file = req.files['course-file'];
  importer.importFullCourse(file, req.user, function(error){
    if(error) return next(error);
    req.session.message = "Course imported successfully.";
    res.redirect('/course_editor'); 
  });

};