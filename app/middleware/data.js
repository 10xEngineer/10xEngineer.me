var Course = load.model('Course');

module.exports = function(app) {
  // Course
  app.param('courseId', function(req, res, next, id){
    Course.findById(id, function(error, course) {
      if(error) {
        next(error);
      }

      if(course) {
        req.course = course;
        req.app.helpers({
          course: course
        });
      }

      next();
    });
  });
};
