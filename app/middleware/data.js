var User = load.model('User');
var Course = load.model('Course');
var Chapter = load.model('Chapter');

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
      .run(function(error, chapter) {
      if(error) {
        next(error);
      }

      if(chapter) {
        chapter.id = parseInt(chapter.id.toString());
        req.chapter = chapter;
        req.app.helpers({
          chapter: chapter
        });
      }

      next();
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
};
