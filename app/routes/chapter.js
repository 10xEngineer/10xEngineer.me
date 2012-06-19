var Chapter = load.model('Chapter');

module.exports = function() {};

// Create new chapter form
module.exports.createView = function(req, res){
  var chapter = res.local('chapter') || {id: '', title: ''};
  res.render('chapters/create', {
    title: 'New Chapter',
    chapter: chapter
  });
};

// Create a new chapter
module.exports.create = function(req, res, next){
  if(req.method == 'GET') {
    module.exports.createView(req, res, next);
  } else if(req.method == 'POST') {
    if(! req.validated) {
      res.locals({ 'chapter': req.body });
      module.exports.createView(req, res, next);
    } else {
      var chapter = new Chapter();
      chapter.title = req.body.title;
      chapter.desc = req.body.description;
      chapter.course = req.course._id;
      chapter.created_by = req.user.id;

      chapter.save(function(error) {
        if(error) {
          log.error(error);
          req.session.error = "Can not create chapter.";
        }

        req.session.message = "Chaper created sucessfully.";
        res.redirect('/course/' + req.course.id);
      });
    }
  }
};

// Load a chapter
module.exports.show = function(req, res) {
  res.render('chapters', {
    title: req.chapter.title
  });
};

// Edit chapter information
module.exports.editView = function(req, res) {
  var chapter = res.local('chapter') || req.chapter;
  res.render('chapters/edit', {
    title: req.chapter.title,
    chapter: chapter
  });
};

// Save edited chapter
module.exports.edit = function(req, res, next){
  if(req.method == 'GET') {
    module.exports.editView(req, res, next);
  } else if(req.method == 'POST') {
    if(! req.validated) {
      res.locals({ 'chapter': req.body });
      module.exports.editView(req, res, next);
    } else {
      var chapter = req.chapter;

      chapter.title = req.body.title;
      chapter.desc = req.body.desc;

      chapter.save(function(error) {
        if(error) {
          log.error(error);
          req.session.error = "Can not updated chapter.";
        }
        req.session.message = "Chaper updated sucessfully.";
        res.redirect('/chapter/' + chapter.id);
      });
    }
  }
};

// Remove a chapter
module.exports.remove = function(req, res) {

  var chapter = req.chapter;
  var courseId =req.chapter.course.id;

  chapter.removeChapter(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not delete chapter.";
      res.redirect('/chapter/:id');
    }
    req.session.message = "Chaper deleted sucessfully.";
    res.redirect('/course/'+ courseId);
  });
};

// Publish a chapter
module.exports.publish = function(req, res) {
  var chapter = req.chapter;

  chapter.publish(true, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not published chapter.";
    }
    req.session.message = "Chapter published sucessfully.";
    res.redirect('/course/' + chapter.course.id);
  });
};

// unpublish a chapter
module.exports.unpublish = function(req, res) {
  var chapter = req.chapter;
  chapter.publish(false, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not unpublished chapter.";
    }
    req.session.message = "Chapter unpublished sucessfully.";
    res.redirect('/course/' + chapter.course.id);
  });
};


// For Move up & Down Chapters

module.exports.up = function(req, res, next){
  var chapter = req.chapter;

  chapter.move(0, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved chapter.";
    }
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/course/' + chapter.course.id);
  });
};

module.exports.down = function(req, res, next){
   var chapter = req.chapter;

  chapter.move(1, function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not moved chapter.";
    }
    req.session.message = "Chaper moved sucessfully.";
    res.redirect('/course/' + chapter.course.id);
  });
};