var fs = require('fs');
var cdn = load.helper('cdn');
var Progress = load.model('Progress');


module.exports = function() {};

// Load Model
var Chapter = load.model('Chapter');
var Lesson = load.model('Lesson');


// Display create lesson page
module.exports.createView = function(req, res) {
  res.render('chapters/lesson_create', {
    title: req.chapter.title,
    lesson: {title: '', description: ''}
  });
};

// Create a lesson
module.exports.create = function(req, res, next) {
  var lesson = new Lesson();
  lesson.chapter = req.chapter._id;
  lesson.title = req.body.title;
  lesson.description = req.body.description;
  lesson.video.type = req.body.videoType;
  lesson.video.content = req.body.videoContent;
  lesson.type = req.body.type;
  lesson.programming.language = req.body.language ;
  lesson.programming.skeletonCode = req.body.code ;
  lesson.programming.input = req.body.input ;
  lesson.programming.output = req.body.output ;
  log.info('Lesson Post :',req.body);
  
  // For Quiz
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


  var f = req.files['videofile'];

  lesson.save(function(error) {
    if(error) {
      log.error(error);
      error = "Can not create lesson.";
    }
    var id = lesson.id;
    if(lesson.type == 'video')
    {
      if(lesson.video.type == 'upload')  {  
        
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
              message = "Lesson created successfully.";
              res.redirect('/lesson/' + id);
            });
          });
        });
      } else {
        req.session.newLesson = {title: lesson.title, _id: lesson._id};
        message = "Lesson created successfully.";
        res.redirect('/lesson/' + id);
      }
    } else {
      req.session.newLesson = {title: lesson.title, _id: lesson._id};
      message = "Lesson created successfully.";
      res.redirect('/lesson/' + id);
    }
  });
};

// Display a lesson
module.exports.showView = function(req, res) {

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

  // Render based on the type
  res.render('lessons/' + req.lesson.type, {
    title: req.lesson.title,
    quiz: req.lesson.quiz
  });
};

module.exports.show = function(req, res){
  var lesson = req.lesson;

  log.info(req.body);
  var quizQuestions = req.lesson.quiz.questions;
  var attentquizQuestionAnswer = req.body.question;
  var quizQuestionsLength = req.lesson.quiz.questions.length;

  for(var questionsIndex=0 ; questionsIndex < quizQuestionsLength ; questionsIndex++) {
    log.info(attentquizQuestionAnswer[questionsIndex]);
    log.info(quizQuestions[questionsIndex].answers);
    if (quizQuestions[questionsIndex].answers == attentquizQuestionAnswer[questionsIndex]){
      message = "Question :"+quizQuestions[questionsIndex].question+" is right.";
    } else {
      error = "Question :"+quizQuestions[questionsIndex].question+" is wrong.";
    }
  }

  var answersStatus = [];
  for(var questionsIndex=0 ; questionsIndex < quizQuestionsLength ; questionsIndex++) {
   
    if (quizQuestions[questionsIndex].answers == attentquizQuestionAnswer[questionsIndex]){
      answersStatus[questionsIndex] = {status :true};
    } else {
      answersStatus[questionsIndex] = {status :false , message :quizQuestions[questionsIndex].answers };
    }
  }
  

  res.render('lessons/' + lesson.type, {
    title: req.lesson.title,
    quiz: req.lesson.quiz,
    answersStatus: answersStatus,
  });
  
};


// Lesson Comletes
module.exports.complete = function(req, res) {
  res.contentType('text/plain');
  var progress = Progress.findOne({ user: req.user._id, course: req.course._id}, function(error, progress) {
    if(error) {
      log.error(error);
      res.end("false");
    }
    progress.completeLesson(req.chapter.id, req.lesson.id, function(error){
      if(error) {
        log.error(error);
        res.end("false");
      }
      res.end("true");
    })
  
  });

}

// Remove entire lesson
module.exports.remove = function(req, res, next){
  log.info('Removing lesson...');

  var lesson = req.lesson;
  var chapterId =lesson.chapter.id;
  
  lesson.removeLesson(function(error){
    if (error) {
      log.error(error);
      error = "Can not remove lesson.";
      res.redirect('/chapter/:id');
    }
    message = "Sucessfully lesson removed.";
    res.redirect('/chapter/'+ chapterId);
  });
};

// For Move up & Down Chapters

module.exports.up = function(req, res, next){
  
  var lesson = req.lesson;

  lesson.move(0, function(error) {
    if(error) {
      log.error(error);
      error = "Can not moved lesson.";
    }
    message = "Lesson moved sucessfully.";
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
      error = "Can not moved lesson.";
    }
    message = "Lesson moved sucessfully.";
    res.redirect('/chapter/' + lesson.chapter.id);
  });
};

// For Next Or Previous Lesson
module.exports.next = function(req,res){

  var lesson = req.lesson;

  lesson.getNext(function(error,nextLessonID) {
    if(error) {
      log.error(error);
      error = "Can not moved to next lesson.";
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
      error = "Can not moved to previous lesson.";
    }
    if(preLessonID == null) {
      res.redirect('/course/' + req.course.id);
    } else {
      res.redirect('/lesson/' + preLessonID);
    }
  });
  
};
