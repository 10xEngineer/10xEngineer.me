var fs = require('fs');
var cdn = load.helper('cdn');

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
  lesson.type = 'video';

  var f = req.files['videofile'];

  lesson.save(function(error) {
    if(error) {
      log.error(error);
      error = "Can not create lesson.";
    }
    var id = lesson.id;
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
