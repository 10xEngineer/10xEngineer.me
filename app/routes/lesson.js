
module.exports = function() {};

// Display create lesson page
module.exports.createView = function(req, res) {
  res.render('chapters/lesson_create', {
    title: req.chapter.title,
    lesson: {title: '', description: ''}
  });
};

// Create a lesson
module.exports.create = function(req, res) {

  var data = {
    chapter: req.chapter._id,
    title: req.body.title,
    description: req.body.description
  };

  if (!data.created_by) {
    data.created_by = req.user.id;
  }

  var lesson = new Lesson(data);
  Lesson.save(function(error) {
    if(error) {
      log.error(error);
      error = "Can not create lesson.";
    }
    message = "Sucessfully create lesson.";
    res.redirect('/chapter/' + req.chapter._id);
  });
};

// Display a lesson
module.exports.show = function(req, res) {
  // Render based on the type
  res.render('lessons/' + req.lesson.type, {
    title: req.lesson.title
  });
};

// Remove entire lesson
module.exports.remove = function(req, res, next){
  log.info('Removing lesson...');

  var lesson = req.course;

  course.removeLesson(function(error){
    if (error) {
      log.error(error);
      error = "Can not remove lesson.";
    }
    message = "Sucessfully lesson removed.";
    res.redirect('/courses/');
  });
};