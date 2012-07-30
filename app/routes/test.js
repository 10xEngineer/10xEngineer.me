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
  var test = req.test;
  var testId = test._id;

  if(req.session.currQuestion) {
    delete req.session.currQuestion;
  }
  
  generateQuestionPaper(test, function(error, questionPaper){

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
};

var getRandom = function(MaxNum) {
  return Math.floor(Math.random()*MaxNum);
}

var generateQuestionPaper = function(test, callback) {
  
  var Question = model.Question;
  var mark = test.mark;
  // Todo : All logic is remaining  :p
  var questionPaper = [];
  var easyWeight = mark * 0.4;
  var midWeight  = mark * 0.4;
  var hardWeight = mark * 0.2;
  var noOfHardQuestions = parseInt(hardWeight/3);
  var rand = Math.random();
  var direction = (rand>0.5) ? '$gte': '$lt' ;

  var noOfCollectedQuestions =0;
  var random = {};
  random[direction] = rand;
  Question.find({difficulty : 3, random : random }, { _id : 1})
    .sort('random', -1 )
    .limit(noOfHardQuestions)
    .exec(function(error, hardQuestions){
    if(error) {
      log.error(error);
    }
    noOfCollectedQuestions = hardQuestions.length;
    for (var index = 0; index < noOfCollectedQuestions; index++) {
      var sampleQuestion = {}; 
      sampleQuestion['question'] = hardQuestions[index]._id;
      questionPaper.push(sampleQuestion);
    }

    if ( noOfCollectedQuestions < noOfHardQuestions ) {
      direction = (direction=='$gte') ? '$lt': '$gte';
      var random = {};
      random[direction] = rand;
      Question.find({difficulty : 3, random : random }).sort('random', 1).limit(noOfHardQuestions-noOfCollectedQuestions).exec(function(error, hardQuestions){
        if(error) {
          log.error(error);
        }
        var length = hardQuestions.length;
        for (var index = 0; index < length; index++) {
          var sampleQuestion = {}; 
          sampleQuestion['question'] = hardQuestions[index]._id;
          questionPaper.push(sampleQuestion);
        }
        noOfCollectedQuestions+= length;
        callback(null, questionPaper);

      });
    } else {
      callback(null, questionPaper);
    }
  });

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
  delete req.session.currQuestion;
  res.render('test/attempt/result');
};
