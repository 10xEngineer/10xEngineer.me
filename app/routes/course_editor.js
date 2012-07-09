var Course = load.model('Course');
var importer = load.helper('importer');
var fs = require('fs');
var Chapter = load.model('Chapter');
var Lesson = load.model('Lesson');
var LabDef = load.model('LabDef');
var cdn = load.helper('cdn');
//var request = require('request');



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
	Course.find({},function(error, courses){
	  res.render('course_editor', {
	  	courses : courses,
      user: req.user
	  });
	})
};

/************************************
** Create course view              **
************************************/
module.exports.createView = function(req, res){
  res.render('course_editor/course/create', {
    title: 'New Course',
    course: {_id:'',title:'',description:''},
  });
};

/************************************
** Submit created course           **
************************************/
module.exports.create = function(req, res, next){
  var course = new Course();
  var util = load.helper('util');
  course.title = req.body.title;
  course.desc = req.body.description;
  course.image = req.body.image;
  course.cropImgInfo = req.body.cropImgInfo;
  course.created_by = req.user._id;

  // Saves Created Course
  course.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create course.";
      next(error);
    }

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
    index :0,
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

  parsedCourse['created_by'] = req.user._id;
  importer.course(parsedCourse, function(error, course) {

    // Add chapters
    var chapters = parsedCourse.chapters;
    if(!chapters.length || chapters.length === 0) {
      res.redirect('/course_editor');
    }

    var chapterLength = chapters.length;
    for(var index = 0; index < chapterLength; index++) {
      var chapterData = chapters[index];

      importer.chapter(chapterData, course._id, function(error, chapter, lessons) {

        var lessonLength = lessons.length;
        for(var index2 = 0; index2 < lessonLength; index2++) {
          var lessonData = lessons[index2];
          importer.lesson(lessonData, chapter._id);          
        }
      });
    }

    // Success
    req.session.message = "Import Sucessfully Course.";
    res.redirect('/course_editor');
  });
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
    if(error) {
      log.error(error);
      req.session.error = "Can not updated course.";
    }
    req.session.message = "Course updated sucessfully.";
    res.redirect('/course_editor/course/' + course.id);
  });
};


module.exports.remove = function(req, res, next){
  
  var course = req.course;

  course.removeCourse(function(error){
    if (error) {
      log.error(error);
      req.session.error = "Can not remove course.";
    }
    req.session.message = "Sucessfully course removed.";
    res.redirect('/course_editor');
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

// unpublish a chapter
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


/*********************************************
**********************************************
**                                          **
**  Chapter Operations                      **
**                                          **
**********************************************
*********************************************/

module.exports.chapterView = function (req, res) {
  res.render('course_editor/chapter', {
    title: req.chapter.title
  });
}

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
  
  LabDef.find(function (error, lab) {
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
    f = req.files['videofile'];
    lesson.save(function(error) {
      if(error) {
        log.error(error);
        req.session.error = "Can not create lesson.";
      }
      var id = lesson.id;
      if(lesson.video.type == 'upload')
      {
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
      }
      else saveLesson(lesson, req, res); 
    });
  }

  // For Programming Lesson
  if(lesson.type == 'programming') {
    lesson.programming.language = req.body.language ;
    lesson.programming.skeletonCode = req.body.code ;
    lesson.programming.input = req.body.input ;
    lesson.programming.output = req.body.output ;
    saveLesson(lesson, req, res);
  }
  // For Quiz Lesson
  if(lesson.type == 'quiz') {

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
  }

  // For sysAdmin Lesson
  if(lesson.type == 'sysAdmin') {
    var f = req.files['verificationFile'];
    var serverInfoArray = [];
    var vmTamplateIdList = req.body.serverName;
    var vmNameList = req.body.vmNames;
    var vmHostNameList = req.body.vmHostNames;
    var vms = [];
    if(typeof(vmTamplateIdList) == 'string') vmTamplateIdList = [vmTamplateIdList];
    if(typeof(vmNameList) == 'string') vmNameList = [vmNameList];
    if(typeof(vmHostNameList) == 'string') vmHostNameList = [vmHostNameList];

    LabDef.find({_id : { $in : vmTamplateIdList}}, function (error, lab) {
      for(var index = 0; index < vmTamplateIdList.length; index++) {
        var tmpJSON = {};
        tmpJSON['vm_name'] = vmNameList[index];
        tmpJSON['hostname'] = vmHostNameList[index];
        tmpJSON['ref'] = vmTamplateIdList[index];
        for(labIndex = 0; labIndex < lab.length; labIndex++) {
          if(vmTamplateIdList[index] == lab[labIndex]._id) {
            tmpJSON['vm_type'] = lab[labIndex].type;
            tmpJSON['runlist'] = lab[labIndex].runList;
            tmpJSON['vm_attrs'] = {};
            tmpJSON['vm_attrs']['memory'] = lab[labIndex].memory;
            tmpJSON['vm_attrs']['storage'] = lab[labIndex].storage;
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
}

var request = function(config, callback) {
  var actualObj = config.multipart[0].body['vms'];
  callback(null, actualObj, config);
}

// Lesson Edit
module.exports.lessonEditView = function(req, res) {
  
  var lesson = req.lesson;
  var answersJSON = {};
  if(lesson.type == 'quiz') {
    
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
    }
  }
  LabDef.find(function (error, lab) {
    res.render('course_editor/lesson/edit', {
      title: req.lesson.title,
      description: req.lesson.desc,
      answersJSON: answersJSON,
      edit: true,
      lab: lab,
      lesson : req.lesson
    });
  });
}

// Save edited chapter
module.exports.lessonEdit = function(req, res){
  
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
      var f = req.files['videofile'];
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
    var questionLength = req.body.question.length - 1;
    var lessonInstanceQuestion = [];
    for (var indexQuestion = 0; indexQuestion < questionLength; indexQuestion++) {        
      
      var instanceQuestion = {
        question : '',
        options  : [],
        answers  : []
      };

      instanceQuestion.question = req.body.question[indexQuestion];

      var optionsLength = req.body.questionOption[indexQuestion].length - 1;
      var answerIndex = 0;
      for (var indexOption = 0; indexOption < optionsLength; indexOption++) {
        instanceQuestion.options[indexOption] = req.body.questionOption[indexQuestion][indexOption];
        if(req.body.questionOptionCheckbox[indexQuestion][indexOption]) {
          instanceQuestion.answers[answerIndex++] = req.body.questionOption[indexQuestion][indexOption];
        }
      }
      lessonInstanceQuestion.push(instanceQuestion);
    }
    lesson.quiz.questions = lessonInstanceQuestion;
  }

  // Sys Admin Lesson 
  if(lesson.type == 'sysAdmin'){
    var serverInfoArray = [];
    var serverName = req.body.serverName;
    lesson.sysAdmin.serverInfo = serverName;
    var f = req.files['videofile'];
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
  var chapterId =lesson.chapter.id;
  
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
  //For random the options
  var lesson = req.lesson;
  if(lesson.type=='sysAdmin'){
    LabDef.find({_id: { $in : lesson.sysAdmin.serverInfo}}, function(error, labdeflist){
      res.render('course_editor/lesson/' + req.lesson.type, {
        lesson: lesson,
        labs : labdeflist
      });
    })
  }
  else {
    res.render('course_editor/lesson/' + req.lesson.type, {
      lesson : lesson
    });
  }
};