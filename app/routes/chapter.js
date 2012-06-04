var Chapter = load.model('Chapter');

module.exports = function() {};

// Create new chapter form
module.exports.createView = function(req, res){
  res.render('chapters/create', {
    title: 'New Chapter',
    chapter: {id: '', title: ''}
  });
};

// Create a new chapter
module.exports.create = function(req, res){
  var chapter = new Chapter();
  chapter.title = req.body.title;
  chapter.desc = req.body.description;
  chapter.course = req.course._id;
  chapter.created_by = req.user.id;

  chapter.save(function(error) {
    if(error) {
      log.error(error);
      error = "Can not create chapter.";
    }

    message = "Chaper created sucessfully.";
    res.redirect('/course/' + req.course.id);
  });
};

// Load a chapter
module.exports.show = function(req, res) {
  res.render('chapters', {
    title: req.chapter.title
  });
};

// Edit chapter information
module.exports.editView = function(req, res) {
  res.render('chapters/edit', {
    title: req.chapter.title
  });
};

// Save edited chapter
module.exports.edit = function(req, res){
  var chapter = req.chapter;

  chapter.title = req.body.title;
  chapter.desc = req.body.description;

  chapter.save(function(error) {
    if(error) {
      log.error(error);
      error = "Can not updated chapter.";
    }
    message = "Chaper updated sucessfully.";
    res.redirect('/chapter/' + chapter.id);
  });
};

// Remove a chapter
module.exports.remove = function(req, res) {
  log.info('Removing chapter...');

  var chapter = req.chapter;
  var courseId =req.chapter.course.id;

  chapter.removeChapter(function(error) {
    if(error) {
      log.error(error);
      error = "Can not delete chapter.";
      res.redirect('/chapter/:id');
    }
    message = "Chaper deleted sucessfully.";
    res.redirect('/course/'+ courseId);
  });
};

// Publish a chapter
module.exports.publish = function(req, res) {
  var chapter = req.chapter;

  chapter.publish(true, function(error) {
    if(error) {
      log.error(error);
      error = "Can not published chapter.";
    }
    message = "Chaper published sucessfully.";
    res.redirect('/course/' + chapter.course.id);
  });
};

// unpublish a chapter
module.exports.unpublish = function(req, res) {
  var chapter = req.chapter;

  chapter.publish(false, function(error, chapter) {
    if(error) {
      log.error(error);
      error = "Can not unpublished chapter.";
    }
    message = "Chaper unpublished sucessfully.";
    res.redirect('/course/' + chapter.course.id);
  });
};
