var User = load.model('User');
var Course = load.model('Course');
var Chapter = load.model('Chapter');
var Lesson = load.model('Lesson');
var LabDef = load.model('LabDef');

module.exports = function(app) {

  // Course
  app.param('courseId', function(req, res, next, id){
    Course.findOne({ id: id })
      .populate('chapters')
      .populate('created_by')
      .run(function(error, course) {
      if(error) {
        next(error);
      }

      if(course) {
        course.id = parseInt(course.id.toString());
        req.course = course;
        req.app.helpers({
          course: course
        });
      }

      next();
    });
  });

  // Chapter
  app.param('chapterId', function(req, res, next, id){
    Chapter.findOne({ id: id })
      .populate('course')
      .populate('lessons')
      .run(function(error, chapter) {
      if(error) {
        next(error);
      }

      if(chapter) {
        chapter.id = parseInt(chapter.id.toString());
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
    Lesson.findOne({ id: id })
      .populate('chapter')
      .run(function(error, lesson) {
      if(error) {
        next(error);
      }

      if(lesson) {
        Course.findById(lesson.chapter.course)
          .populate('chapters')
          .run(function(error, course) {
          Chapter.findById(lesson.chapter._id)
          .populate('lessons')
          .run(function(error, chapter) {
            lesson.id = parseInt(lesson.id.toString());
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
    User.findById(id, function(error, user) {
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

  // LabDef
  app.param('labDefId', function(req, res, next, id){
    LabDef.findOne({ id: id })
    .run(function(error, labDef) {
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