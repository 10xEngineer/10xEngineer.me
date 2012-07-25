var model = require('../models');

module.exports.createView = function(req, res) {
	var test = {
		title: "",
		desc: "",
		type: "quiz"
	};
	res.render('test/create',{
		title: "Test",
		test : test
	});
};

module.exports.create = function(req, res) {
  var Test = model.Test;

  var test = new Test();
  test.title = req.body.title;
  test.desc = req.body.description;
  test.type = req.body.type;

  // Saves Created Test
  test.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create test.";
      res.redirect('/test/create');
    }

    log.info("Test saved.");
    req.session.message = "Test created successfully.";
    res.redirect('/test/' + test.id);
  });
};

module.exports.view = function(req, res) {
  var Question = model.Question;
  var Test = model.Test;
  log.info("Id : ", req.test._id.toString());
  Question.find({ test: req.test._id }, function(error, questions) {
    log.info(questions);
    if(error){
      log.error("Error: ", error);
      redirect('/test');
    }
    res.render('test/view', {
      title:  "Test",
      test: req.test,
      questions: questions
    });
  });
};