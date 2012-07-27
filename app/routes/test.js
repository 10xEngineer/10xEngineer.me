var model = require('../models');
var async = require('async');

module.exports.createView = function(req, res) {
	var test = {
    title: "",
		mark: "",
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
  test.mark = req.body.mark;
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
  test.mark = req.body.mark;
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
  var Question = model.Question;
  var test = req.test._id;
  var mark = req.test.mark;

  delete req.session.currQuestion;
  async.parallel([
    function(innerCallback){
      Question.find({difficulty : {$gt: 0, $lte: 3}, test: test}, {_id: 1, weightage: 1}, innerCallback);
    },
    function(innerCallback){
      Question.find({difficulty : {$gt: 3, $lte: 7}, test: test}, {_id: 1, weightage: 1}, innerCallback);
    },
    function(innerCallback){
      Question.find({difficulty : {$gt: 7, $lte: 10}, test: test}, {_id: 1, weightage: 1}, innerCallback);
    }],
    function(error, results){ // result = [easy, mid, hard]
      generateQuestionPaper(results, mark, function(error, questionPaper){
        var assessment = new Assessment();
        assessment.test = test;
        assessment.user = req.user._id;
        assessment.score = 0;
        assessment.attemptedDetails = questionPaper;

        assessment.save(function(error){
          if(error){
            log.error(error);
            res.redirect('/test');
          }
          req.session.assessment = assessment;
          res.redirect("/test/"+req.test.id+"/next");
        });
      });
    }
  );
};

var getRandom = function(MaxNum) {
  return Math.floor(Math.random()*MaxNum);
}

var generateQuestionPaper = function(questions, mark, callback) {
  var easyQuestions = questions[0];
  var midQuestions = questions[1];
  var hardQuestions = questions[2];

  // Todo : All logic is remaining  :p
  var questionPaper = [];
  var easyWeight = mark * 0.4;
  var midWeight  = mark * 0.4;
  var hardWeight = mark * 0.2;

  var currWeight = 0;
  while(true){
    var sampleQuestion = {}; 
    var randomIndex = getRandom(easyQuestions.length);
    var tmpQuestion = easyQuestions[randomIndex];
    sampleQuestion['question'] = tmpQuestion._id;
    questionPaper.push(sampleQuestion);
    currWeight+=tmpQuestion.weightage;
    easyQuestions.splice(randomIndex, 1);
    if(currWeight>=easyWeight) break;    
  }
  log.info("Marks after Easy questions selection :: ", currWeight);
  while(true){
    var sampleQuestion = {}; 
    var randomIndex = getRandom(midQuestions.length);
    var tmpQuestion = midQuestions[randomIndex];
    sampleQuestion['question'] = tmpQuestion._id;
    questionPaper.push(sampleQuestion);
    currWeight+=tmpQuestion.weightage;
    midQuestions.splice(randomIndex, 1);
    if(currWeight>=easyWeight+midWeight) break;    
  }
  log.info("Marks after Mid questions selection :: ", currWeight);
  while(true){
    var sampleQuestion = {}; 
    var randomIndex = getRandom(hardQuestions.length);
    var tmpQuestion = hardQuestions[randomIndex];
    sampleQuestion['question'] = tmpQuestion._id;
    questionPaper.push(sampleQuestion);
    currWeight+=tmpQuestion.weightage;
    hardQuestions.splice(randomIndex, 1);
    if(currWeight>=mark) break;    
  }
  log.info("Total Marks of Question paper will be ", currWeight);

  callback(null, questionPaper);
}

module.exports.nextQuestion = function(req, res) {
  var Question = model.Question;
  // Collect answers and update it into database as well as session assessment
  // find next question and render that answer
  if(!req.session.currQuestion){
    req.session.currQuestion = 0;
  }

  Question.findOne({ _id: req.session.assessment.attemptedDetails[req.session.currQuestion].question}, function(error, question){
    if(error){
      log.error(error);
      res.redirect('/test');
    }
    var finish = false;
    if(req.session.assessment.attemptedDetails.length == req.session.currQuestion+1) {
      finish = true;
    }
    // TODO:: Randomize options of question
    var options = [];
    var length = question.choices.length;
    for (var index = 0; index < length; index++) {
      var randIndex = getRandom(question.choices.length);
      options.push(question.choices[randIndex]);
      question.choices.splice(randIndex,1);
    };
    question.choices = options;

    res.render('test/attempt/question', {
      title : "Title",
      finish: finish,
      question: question 
    });
  });
};

module.exports.submitQuestion = function(req, res) {
  var Assessment = model.Assessment;
  var assessment = req.session.assessment;
  var currQuestion = req.session.currQuestion;
  var options = req.body.questionOption;
  var length = options.length;
  var ans = [];
  for (var count = 0; count < length; count++) {
    if(options[count]) {
      ans.push(options[count]);
    }
  }
  // TODO: Calculate Score and update it befor save

  // Saving assessment  into database
  Assessment.findOne({ id: assessment.id }, function(error, assessment) {
    assessment.attemptedDetails[currQuestion]['givenAns'] = ans;
    assessment.save(function(error) {
      if(error){
        log.error(error);
        res.redirect('/test/'+req.test.id+'/next');
      }
      currQuestion += 1;
      if(assessment.attemptedDetails.length == currQuestion){
        delete req.session.currQuestion;
        delete req.session.assessment;
        return res.redirect('/test/'+req.test.id+'/finish');
      }
      req.session.currQuestion = currQuestion;
      req.session.assessment = assessment;
      res.redirect('/test/'+req.test.id+'/next');
    });
  });
};

module.exports.testResult = function(req, res) {
  res.render('test/attempt/result');
};
