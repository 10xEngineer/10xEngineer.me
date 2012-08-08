var async = require('async');

var model = require('../models');

module.exports = function(app) {
  var Course = model.Course;
  var Chapter = model.Chapter;

  // Course
  app.param('courseId', function(req, res, next, id){
    Course.findOne({ id: id })
      .populate('chapters')
      .populate('created_by')
      .exec(function(error, course) {
      if(error) {
        next(error);
      }

      if(course) {

        // Populate lessons in course chapters
        async.map(course.chapters, function(chapter, callback) {
          Chapter.findById(chapter._id)
            .populate('lessons')
            .exec(function(error, populatedChapter) {
            if(error) {
              callback(error);
            }

            callback(null, populatedChapter);
          });
        }, function(error, chapters) {

          course.id = parseInt(course.id.toString(), 10);

          req.chapters = chapters;
          req.course = course;

          req.app.helpers({
            course: course,
            chapters: chapters
          });
          next();
        });
      } else {
        next();
      }
    });
  });

  // Chapter
  app.param('chapterId', function(req, res, next, id){
    var Chapter = model.Chapter;

    Chapter.findOne({ id: id })
      .populate('course')
      .populate('lessons')
      .exec(function(error, chapter) {
      if(error) {
        next(error);
      }

      if(chapter) {
        chapter.id = parseInt(chapter.id.toString(), 10);
        req.chapter = chapter;
        req.course = chapter.course;
        req.app.helpers({
          chapter: chapter,
          course: chapter.course
        });
      }

      next();
    });
  });

  // Lesson
  app.param('lessonId', function(req, res, next, id){
    var Lesson = model.Lesson;
    var Course = model.Course;
    var Chapter = model.Chapter;

    Lesson.findOne({ id: id })
      .populate('chapter')
      .exec(function(error, lesson) {
      if(error) {
        next(error);
      }

      if(lesson) {
        Course.findById(lesson.chapter.course)
          .populate('chapters')
          .exec(function(error, course) {
          Chapter.findById(lesson.chapter._id)
          .populate('lessons')
          .exec(function(error, chapter) {
            lesson.id = parseInt(lesson.id.toString(), 10);
            req.lesson = lesson;
            req.chapter = chapter;
            req.course = course;
            req.app.helpers({
              lesson: lesson,
              chapter: chapter,
              course: course
            });
            next();
          });          
        });
      } else {
        next();
      }
    });
  });

  // User
  app.param('userId', function(req, res, next, id){
    var User = model.User;

    User.findOne({ id: id }, function(error, user) {
      if(error) {
        next(error);
      }

      if(user) {
        req.extUser = user;
        req.app.helpers({
          extUser: user
        });
      }
     
      next();
    });
  });

  // Quiz
  app.param('quizId', function(req, res, next, id){
    var Quiz = model.Quiz;

    Quiz.findOne({ id: id }, function(error, quiz) {
      if(error) {
        next(error);
      }

      if(quiz) {
        req.quiz = quiz;
        req.app.helpers({
          quiz: quiz
        });
      }
     
      next();
    });
  });


  // QuetionIndex for Quiz
  app.param('questionIndex', function(req, res, next, id){
    var Quiz = model.Quiz;
    req.questionIndex = (id-1).toString();
    next();
  });

  // Question
  app.param('questionId', function(req, res, next, id){
    var Question = model.Question;

    Question.findOne({ id: id })
    .populate('quiz')
    .exec(function(error, question) {
      if(error) {
        next(error);
      }

      if(question) {
        req.question = question;
        req.quiz = question.quiz;
        req.app.helpers({
          question: question
        });
      }
     
      next();
    });
  });

  // Programming
  app.param('ProgrammingId', function(req, res, next, id){
    var Programming = model.Programming;

    Programming.findOne({ id: id }, function(error, Programming) {
      if(error) {
        next(error);
      }

      if(Programming) {
        req.Programming = Programming;
        req.app.helpers({
          Programming: Programming
        });
      }
     
      next();
    });
  });

  // LabDef
  app.param('labDefId', function(req, res, next, id){
    var VMDef = model.VMDef;
    
    VMDef.findOne({ id: id }, function(error, labDef) {
      if(error) {
        next(error);
      }

      if(labDef) {
        req.labDef = labDef;
        req.app.helpers({
          labDef: labDef
        });
      }

      next();
    });
  });
};