var chapter = require('../models/chapter');

// ---------------------
// Middleware
// ---------------------




// ------------
// Routes
// ------------
module.exports = function (app) {

  // Create new course form
  app.get('/chapters/create/:courseId', function(req, res){
    res.render('chapters/create', {
      title: 'New Chapter',
      chapter: {_id: '', title: ''}
    });
  });

  // Create a new course
  app.post('/chapters/create/:courseId', function(req, res){
    var data = {
      course: parseInt(req.params.courseId),
      title: req.body.title,
      description: req.body.description
    };

    if (!data.created_by) {
      data.created_by = req.user.id;
    }
    chapter.createNew( data, function( error, chapter) {
      id = chapter._id;

      res.redirect('/courses/' + req.params.courseId);
    });
  });

  // Load a chapter
  app.get('/chapters/:id', function(req, res) {
    var chapterId = parseInt(req.params.id);

    chapter.findById(chapterId, function(error, chapter) {
      if(error) {
        log.error(error);
      }

      res.render('chapters', {
        title: chapter.title,
        chapter: chapter
      });
    });
  });

  // Display create lesson page
  app.get('/chapters/:id/create_lesson', function(req, res) {
    var chapterId = parseInt(req.params.id);

    res.render('chapters/lesson_create', {
      title: chapter.title,
      lesson: {title: '', description: ''}
    });
  });

  // Remove a chapter
  app.get('/chapters/:id/remove', function(req, res) {
    var chapterId = parseInt(req.params.id);

    chapter.removeChapter(chapterId, function(error) {
      if(error) {
        log.error(error);
        res.redirect('/chapters/:id');
      }
      res.redirect('/courses');
    });
  });

  // Publish a chapter
  app.get('/chapters/:id/publish', function(req, res) {
    var chapterId = parseInt(req.params.id);

    chapter.publish(chapterId, true, function(error, chapter) {
      if(error) {
        log.error(error);
      }

      res.redirect('/courses/' + chapter.course);
    });
  });

  // unpublish a chapter
  app.get('/chapters/:id/unpublish', function(req, res) {
    var chapterId = parseInt(req.params.id);

    chapter.publish(chapterId, false, function(error, chapter) {
      if(error) {
        log.error(error);
      }

      res.redirect('/courses/' + chapter.course);
    });
  });
};
