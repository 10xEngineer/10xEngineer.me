var fs = require('fs');
var cdn = load.helper('cdn');
var Progress = load.model('Progress');
var progressHelper = load.helper('progress');


module.exports = function() {};

// Load Model
var Chapter = load.model('Chapter');
var Lesson = load.model('Lesson');
var LabDef = load.model('LabDef');


// Display create lesson page
module.exports.createView = function(req, res) {
  
  LabDef.find(function (error, lab) {
    res.render('lessons/lesson_create', {
      title: req.chapter.title,
      lesson: {title: '', desc: ''},
      edit: false,
      lab: lab
    }); 
  });


  
};

// Create a lesson
module.exports.create = function(req, res, next) {
  var lesson = new Lesson();
  lesson.chapter = req.chapter._id;
  lesson.title   = req.body.title;
  lesson.desc    = req.body.description;
  lesson.type    = req.body.type;
  
  // For Video Lesson
  if(lesson.type == 'video') {
    lesson.video.type    = req.body.videoType;
    lesson.video.content = req.body.videoContent;
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
  }

  // For sysAdmin Lesson
  if(lesson.type == 'sysAdmin') {
    
    var serverInfoArray = [];
    var serverName = req.body.serverName;
    if(typeof(serverName) == 'string') {
      var optNameArray = serverName.split(' ');
      var selectedServerNo = parseInt(optNameArray[3],10);
      for(var count = 0 ; count < selectedServerNo; count++) {
        serverInfoArray.push((optNameArray[0]));
      }

    } else if(typeof(serverName) == 'object') {

      var length = serverName.length;
      for (var index = 0; index < length; index++) {
        var optNameArray = serverName[index].split(' ');
        var selectedServerNo = parseInt(optNameArray[3],10);
        for(var count = 0 ; count < selectedServerNo; count++) {
          serverInfoArray.push((optNameArray[0]));
        }
      }

    }

    lesson.sysAdmin.serverInfo = serverInfoArray;

  }

  var f = req.files['videofile'];
  var verificationFile = req.files['verificationFile'];

  lesson.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create lesson.";
    }
    var id = lesson.id;
    if(lesson.type == 'video' && lesson.video.type == 'upload') {
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
            res.redirect('/lesson/' + id);
          });
        });
      });
    } else if(lesson.type == 'sysAdmin') {

      var fileName = 'lessonSysAdmin_' + id;

      cdn.saveFile(fileName, verificationFile, function(error, fileName) {
        if(error) {
          log.error(error);
          next(error);
        }

        Lesson.findOne({ id: id }, function(error, lesson) {
          // Save the CDN URL if available
          lesson.sysAdmin.verificationFile = fileName;
          lesson.save(function(error) {
            if(error) {
              log.error(error);
              next(error);
            }

            req.session.newLesson = {title: lesson.title, _id: lesson._id};
            req.session.message = "Lesson created successfully.";
            res.redirect('/lesson/' + id);
          });
        });
      });
    } else {
      req.session.newLesson = {title: lesson.title, _id: lesson._id};
      req.session.message = "Lesson created successfully.";
      res.redirect('/lesson/' + id);
    }
  });
};

// Display a lesson
module.exports.showView = function(req, res) {

  // For Session Progres Update
  var lesson =  req.lesson;
  progressHelper.start(lesson, req.session.progress);

  //For random the options

  var randomOption =function (options) {
    var temp;
    var optionLength = Math.floor(options.length/2)+1;
    
    for (var i = 0; i < optionLength; i++) {

      var n = Math.floor(Math.random() * optionLength);
      temp = options[i];
      options[i]= options[n];
      options[n]=temp;

    }
  };

  var quizQuestions = req.lesson.quiz.questions;
  var quizQuestionsLength = req.lesson.quiz.questions.length;
  for(var questionsIndex=0 ; questionsIndex < quizQuestionsLength ; questionsIndex++) {
    randomOption(quizQuestions[questionsIndex].options);
  }

  Progress.findOne({ user: req.user._id, course: req.course._id}, function(error, progress) {
    if(error) {
      log.error(error);
      next(error);
    }
    var lessonQuiz = {};
    lessonQuiz.chapter = req.chapter.id;
    lessonQuiz.lesson  = req.lesson.id;
    progress.startLesson(lessonQuiz, function(lessonProgress, error, next){
      if(error) {
        log.error(error);
        next(error);
      }
      if(typeof(lessonProgress.videoProgress) != 'undefined') {
        var videoStartTime = lessonProgress.videoProgress;
      } else {
        var videoStartTime = 0;
      }
      // Render based on the type
      Lesson.find({}, function(error, allLessons){
        res.render('lessons/' + req.lesson.type, {
          title: req.lesson.title,
          quiz: req.lesson.quiz,
          videoStartTime: videoStartTime,
          userId: req.user._id,
          allLessons : allLessons
        });
      });
    });
  });

  
};

module.exports.show = function(req, res, next){
  
  var lesson = req.lesson;
  
  // For Session Progres Update
  progressHelper.completed(lesson, req.session.progress);

  var quizQuestions = req.lesson.quiz.questions;
  var attemptedAnswers = req.body.question;
  var quizQuestionsLength = req.lesson.quiz.questions.length;
  var answersJSON = {};

  for(var index = 0; index < quizQuestionsLength; index++) {
    var answers = quizQuestions[index].answers;
    for(var indexAnswers = 0; indexAnswers < answers.length; indexAnswers++) {
      if(!answersJSON[index]) {
        answersJSON[index] = {};
      }

      answersJSON[index][answers[indexAnswers]] = 'true';
    }
  }

  for(var index = 0; index < attemptedAnswers.length; index++){
    var arrayValue = attemptedAnswers[index];
    if(typeof(arrayValue) != 'object') {
      if(_.indexOf(quizQuestions[index].answers, arrayValue) !== -1) {
        answersJSON[index][arrayValue] = 'correct';
      } else {
        answersJSON[index][arrayValue] = 'wrong';
      }
    } else {
      for(indexObject = 0; indexObject < arrayValue.length; indexObject++){
        if(_.indexOf(quizQuestions[index].answers, arrayValue[indexObject]) !== -1) {
          answersJSON[index][arrayValue[indexObject]] = 'correct';
        } else {
          answersJSON[index][arrayValue[indexObject]] = 'wrong';
        }
      }
    }
  }

  Progress.findOne({ user: req.user._id, course: req.course._id}, function(error, progress) {
    if(error) {
      log.error(error);
      next(error);
    }
    var lessonQuiz = {};
    lessonQuiz.chapter = req.chapter.id;
    lessonQuiz.lesson  = req.lesson.id;
    lessonQuiz.quiz    = answersJSON;
    progress.completeLesson(lessonQuiz, function(error, next){
      if(error) {
        log.error(error);
        next(error);
      }
      res.render('lessons/' + lesson.type, {
        title: req.lesson.title,
        attemptedAnswers: answersJSON
      });
    });
  });
};

// Lesson Edit
module.exports.editView = function(req, res) {
  
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

  res.render('lessons/edit', {
    title: req.lesson.title,
    description: req.lesson.desc,
    answersJSON: answersJSON,
    edit: true
  });
}

// Save edited chapter
module.exports.edit = function(req, res){
  
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
            res.redirect('/lesson/' + id);
          });
        });
      });
    } else {
      req.session.message = "Lesson edited successfully.";
      res.redirect('/lesson/' + id);
    }
  });
};


// Lesson Completes
module.exports.complete = function(req, res) {
  res.contentType('text/plain');
  Progress.findOne({ user: req.user._id, course: req.course._id}, function(error, progress) {
    if(error) {
      log.error(error);
      res.end("false");
    }
    var lessonVideo = {};
    lessonVideo.chapter = req.chapter.id;
    lessonVideo.lesson  = req.lesson.id;
    progress.completeLesson(lessonVideo, function(error){
      if(error) {
        log.error(error);
        res.end("false");
      }
      res.end("true");
    });
  
  });

};

// Lesson Update Progress
module.exports.updateProgress = function(req, res) {
  res.contentType('text/plain');
  var seconds = req.query.seconds;
  Progress.findOne({ user: req.user._id, course: req.course._id}, function(error, progress) {
    if(error) {
      log.error(error);
      res.end("false");
    }
    var lessonVideo = {};
    lessonVideo.chapter = req.chapter.id;
    lessonVideo.lesson  = req.lesson.id;
    progress.updateProgress(lessonVideo, seconds, function(error){
      if(error) {
        log.error(error);
        res.end("false");
      }
      res.end("true");
    });
  
  });

};

// Lesson ServerInfo
module.exports.serverInfo = function(req, res) {
  res.contentType('text/plain');
  var id = req.query.id;

  LabDef.findById(id, function (error, lab) {
    if(error) {
      log.error(error);
      res.end("false");
    }
    res.json({
      serverInfo : {
        cpu: lab.cpu,
        id: lab.id,
        memory: lab.memory,
        name: lab.name,
        storage: lab.storage,
        type: lab.type,
        runList: lab.runList
      }
    });

  });

};


// Remove entire lesson
module.exports.remove = function(req, res, next){

  var lesson = req.lesson;
  var chapterId =lesson.chapter.id;
  
  lesson.removeLesson(function(error){
    if (error) {
      log.error(error);
      req.session.error = "Can not remove lesson.";
      res.redirect('/chapter/:id');
    }
    req.session.message = "Sucessfully lesson removed.";
    res.redirect('/chapter/'+ chapterId);
  });
};

// For Move up & Down Chapters

module.exports.up = function(req, res, next){
  
  var lesson = req.lesson;

  lesson.move(0, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved lesson.";
    }
    req.session.message = "Lesson moved sucessfully.";
    res.redirect('/chapter/' + lesson.chapter.id);
  });
};



// Publish a lesson
module.exports.publish = function(req, res) {
  
  var lesson = req.lesson;

  lesson.publish(true, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not published lesson.";
    }
    req.session.message = "Lesson published sucessfully.";
    res.redirect('/chapter/' + lesson.chapter.id);
  });
};

// unpublish a lesson
module.exports.unpublish = function(req, res) {
  
  var lesson = req.lesson;
  
  lesson.publish(false, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not unpublished lesson.";
    }
    req.session.message = "Lesson unpublished sucessfully.";
    res.redirect('/chapter/' + lesson.chapter.id);
  });
};

// for up or down lesson
module.exports.down = function(req, res, next){
  
  var lesson = req.lesson;

  lesson.move(1, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved lesson.";
    }
    req.session.message = "Lesson moved sucessfully.";
    res.redirect('/chapter/' + lesson.chapter.id);
  });
};

// For Next Or Previous Lesson
module.exports.next = function(req,res){

  var lesson = req.lesson;

  lesson.getNext(function(error,nextLessonID) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved to next lesson.";
    }  
    if(nextLessonID == null) {
      res.redirect('/course/' + req.course.id);
    } else {
      res.redirect('/lesson/' + nextLessonID);
    }
  });
  
};

module.exports.previous = function(req,res){

  var lesson = req.lesson;

  lesson.getPrevious(function(error,preLessonID) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved to previous lesson.";
    }
    if(preLessonID == null) {
      res.redirect('/course/' + req.course.id);
    } else {
      res.redirect('/lesson/' + preLessonID);
    }
  });
  
};
