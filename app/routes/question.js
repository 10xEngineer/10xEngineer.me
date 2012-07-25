var model = require('../models');

module.exports.createView = function(req, res) {
  res.render('question/create',{
		title: "Question",
    edit: false
	});
};

module.exports.create = function(req, res) {
  var Question = model.Question;
  var question = new Question();
  question.test = req.test._id;
  question.question = req.body.question;
  question.waitage = req.body.waitage;
  question.difficulty = req.body.difficulty;
  question.choices = [];
  question.answers = [];

  log.info(JSON.stringify(req.body));

  var optCount = req.body.questionOption.length - 1;
  for (var index = 0; index < optCount; index++) {
    question.choices.push(req.body.questionOption[index]);
    if(req.body.questionOptionCheckbox[index]) {
      question.answers.push(req.body.questionOption[index]);
    }
  };

  log.info(question);

  // Saves Created Question
  question.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create test.";
      res.redirect('/test/create');
    }

    log.info("Question saved.");
    req.session.message = "Question created successfully.";
    res.redirect('/test/' + req.test.id);
  });
};

module.exports.edit= function(req, res) {
  var question = req.question;
  question.test = req.test._id;
  question.question = req.body.question;
  question.waitage = req.body.waitage;
  question.difficulty = req.body.difficulty;
  choices = [];
  answers = [];


  log.info("Before");
  log.info(question.choices);

  var optCount = req.body.questionOption.length - 1;
  for (var index = 0; index < optCount; index++) {
    choices.push(req.body.questionOption[index]);
    if(req.body.questionOptionCheckbox[index]) {
      answers.push(req.body.questionOption[index]);
    }
  };
  question.choices = choices;
  question.markModified('choices');
  question.answers = answers;
  question.markModified('answers');

  // Saves Created Question
  question.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create test.";
      res.redirect('/test/create');
    }

    log.info("Question saved.");
    req.session.message = "Question saved successfully.";
    res.redirect('/test/' + req.test.id);
  });
};


module.exports.view = function(req, res) {
  res.render('test/view', {
    title:  "Question",
    test: req.test
  });
};

module.exports.removeQuestion = function(req, res) {
  var Test = model.Test;
  var question = req.question;
  
  question.remove(function(error){
    if(error){
      log.info(error);
    }
    res.redirect("/test/" + question.test.id);
  });
};

module.exports.editView = function(req, res) {
  var Test = model.Test;
  var question = req.question;
  res.render("question/edit",{
    title: "Question",
    question: question,
    edit: true
  });
};



