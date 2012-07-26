var model = require('../models');

module.exports.createView = function(req, res) {
	var test = {
		title: "",
		desc: "",
		type: "quiz"
	};
	res.render('test/create',{
		title: "Test",
		test : test,
    edit: false
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

    req.session.message = "Test created successfully.";
    res.redirect('/test/' + test.id);
  });
};

module.exports.editView = function(req, res) {
  var test = req.test;
  res.render("test/edit",{
    title: "Test",
    test: test,
    edit: true
  });
};

module.exports.edit = function(req, res) {
  
  var test = req.test;
  test.title = req.body.title;
  test.desc = req.body.description;
  test.type = req.body.type;

  test.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not Update test.";
      res.redirect('/test');
    }
    req.session.message = "Question saved successfully.";
    res.redirect('/test');
  });

};

module.exports.removeTest = function(req, res) {
  var test = req.test;
  
  test.remove(function(error){
    if(error){
      log.error(error);
    }
    req.session.message = "Test remove successfully.";
    res.redirect("/test");
  });
};


module.exports.view = function(req, res) {
  var Question = model.Question;
  var Test = model.Test;
  Question.find({ test: req.test._id }, function(error, questions) {
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

module.exports.testList = function(req, res) {
  var Test = model.Test;
  Test.find({}, function(error, tests){
    if(error){
      log.error("Test could not be fetched.");
      res.redirect('/');
    }
    res.render('test', {
      title: "Test List",
      tests: tests
    })
  })
};


module.exports.startTest = function(req, res) {
  var Assessment = model.Assessment;
  var Quesiton = model.Question;
  var test = req.test._id;

  async.parallel([
    function(innerCallback){
      Question.find({difficulty : {$gt: 0, $lte: 3}, test: test}, {_id: 1, waitage: 1}, innerCallback);
    },
    function(innerCallback){
      Question.find({difficulty : {$gt: 3, $lte: 7}, test: test}, {_id: 1, waitage: 1}, innerCallback);
    },
    function(innerCallback){
      Question.find({difficulty : {$gt: 7, $lte: 10}, test: test}, {_id: 1, waitage: 1}, innerCallback);
    }],
    function(error, resutls){ // result = [easy, mid, hard]
      generateQuestionPaper(results, function(error, questionPaper){
        var assessment = new Assessment();
        assessment.test = test;
        assessment.user = req.user._id;
        assessment.score = 0;
        assessment.attemptedDeatail = questionPaper;

        assessment.save(function(error){
          if(error){
            log.error(error);
            res.redirect('/test');
          }

          Question.find({ _id: questionPaper[0]}, function(error, question){
            if(error){
              log.error(error);
              res.redirect('/test');
            }
            req.session.assessment = assessment;
            res.render('test/attempt/question', {
              assessment: assessment,
              question: question 
            });
          });
        });
      });
    });
  });
};

var generateQuestionPaper = function(questions, callback) {
  var easyQuestions = questions[0];
  var midQuestion = questions[1];
  var hardQuestion = questions[2];
  callback(null, easyQuestions);
}