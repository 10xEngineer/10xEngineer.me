
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
    }

    res.redirect('/chapter/' + req.chapter._id);
  });
};