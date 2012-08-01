var model = require('../models');

var util = require('../helpers/util');

var async = require('async');

// Test List
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

// Test Create
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

// Test Edit
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

// Test Remove
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

// Test Details
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

// Test Start
module.exports.startTest = function(req, res) {
  var Assessment = model.Assessment;
  var Question = model.Question;
  var test = req.test;
  var testId = test._id;

  if(req.session.currQuestion) {
    delete req.session.currQuestion;
  }
   
  generateQuestionPaper(test, function(error, questionPaper){

    questionPaper = util.randomizeArray(questionPaper); 
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
      res.redirect("/test/"+req.test.id+"/1");
    });
  });
};

var generateQuestionPaper = function(test, callback) {
  
  var mark = test.mark;
  // Todo : All logic is remaining  :p
  var questionPaper = [];
  var easyWeight = mark * 0.4;
  var midWeight  = mark * 0.4;
  var hardWeight = mark * 0.2;
  var noOfHardQuestions = parseInt(hardWeight/3);
  var noOfMidQuestions;
  var noOfEasyQuestions;
  var collectedWeight;

  var noOfCollectedQuestions = 0;

  var difficulty = 3;
  getQuestions(test, noOfHardQuestions, difficulty, function(error, hardQuestions){
    if(error){
      callback(error);
    }
    collectedWeight = hardQuestions.length * difficulty;
    midWeight = (parseInt(midWeight+hardWeight - (collectedWeight)));
    difficulty = 2;
    noOfMidQuestions = parseInt(midWeight/difficulty);
    questionPaper = questionPaper.concat(hardQuestions);
    getQuestions(test, noOfMidQuestions, difficulty, function(error, midQuestions){
      if(error){
        callback(error);
      }
      collectedWeight += midQuestions.length * difficulty;
      easyWeight = (parseInt(midWeight+hardWeight+easyWeight - (collectedWeight)));
      difficulty = 1;
      noOfEasyQuestions = parseInt(easyWeight/difficulty);
      questionPaper = questionPaper.concat(midQuestions);
      getQuestions(test, noOfEasyQuestions, difficulty, function(error, easyQuestions){
        if(error){
          callback(error);
        }
        collectedWeight += easyQuestions.length * difficulty;
        questionPaper = questionPaper.concat(easyQuestions);
        callback(null, questionPaper);
      });  
    });
  });


}

var getQuestions = function(test, neededQuestions, difficulty, callback) {
  
  // Difine variables 
  var Question = model.Question;
  var direction = (rand>0.5) ? '$gte': '$lt' ;
  var order = direction == '$lt' ? 1 : -1;
  var rand = Math.random();
  var random = {};
  var resultQuestionsSet = [];

  random[direction] = rand;
  
  // find random questions
  Question.find({difficulty : difficulty, random : random }, { _id : 1})
    .sort('random', order )
    .limit(neededQuestions)
    .exec(function(error, questions){
    if(error) {
      log.error(error);
      callback(error);
    }
    collectedQuestions = questions.length;
    for (var index = 0; index < collectedQuestions; index++) {
      var sampleQuestion = {}; 
      sampleQuestion['question'] = questions[index]._id.toString();
      resultQuestionsSet.push(sampleQuestion);
    }

    if ( collectedQuestions < neededQuestions ) {
      // Need more questions
      direction = (direction=='$gte') ? '$lt': '$gte';
      order = direction == '$lt' ? 1 : -1;
      random = {};
      random[direction] = rand;
      Question
      .find({difficulty : difficulty, random : random }, { _id : 1})
      .sort('random', order)
      .limit(neededQuestions - collectedQuestions)
      .exec(function(error, questions){
        if(error) {
          log.error(error);
          callback(error);
        }
        var length = questions.length;
        for (var index = 0; index < length; index++) {
          var sampleQuestion = {}; 
          sampleQuestion['question'] = questions[index]._id.toString();
          resultQuestionsSet.push(sampleQuestion);
        }
        callback(null, resultQuestionsSet);
      });
    } else {
      callback(null, resultQuestionsSet);
    }
  });
}

// Question View
module.exports.viewQuestion = function(req, res) {
  var Question = model.Question;
  var questionIndex = req.questionIndex;
  var assessment = req.session.assessment;
  var attemptedDetails = assessment.attemptedDetails;
  // Collect answers and update it into database as well as session assessment
  // find next question and render that answer
  if(!req.session.currQuestion) {
    var currQuestion = req.session.currQuestion = 0;
  } else {
    var currQuestion = req.session.currQuestion;
  }

  if(questionIndex>currQuestion || questionIndex<0) {
    req.session.error = "You are not permit to move at that question";
    return res.redirect('/test/'+req.test.id+"/"+(parseInt(currQuestion)+1));
  }

  Question.findOne({ _id: attemptedDetails[questionIndex].question}, function(error, question) {
    if(error){
      log.error(error);
      res.redirect('/test');
    }
    var finish = false;
    if(attemptedDetails.length == currQuestion+1) {
      finish = true;
    }


    var givenAns ;
    if(attemptedDetails[questionIndex].givenAns) givenAns = attemptedDetails[questionIndex].givenAns;
    else givenAns = [];

    // Randomize options of question
    var length = question.choices.length;
    var controls = {
      finish: finish,
      testId: req.test.id,
      displayedQuestionIndex: questionIndex,
      currQuestionIndex: currQuestion
    };
    question.choices = util.randomizeArray(question.choices);
    res.render('test/attempt/question', {
      title : req.test.title,
      question: question, 
      givenAns: givenAns,
      controls: controls
    });
  });
};

module.exports.submitQuestion = function(req, res) {
  var Assessment = model.Assessment;
  var assessment = req.session.assessment;
  var currQuestion = req.session.currQuestion;
  var options = req.body.questionOption;
  var length = options.length;
  var gotMarks = 0;
  var ans = [];

  // Collect answers given by user
  if(typeof(options)=='object'){
    for (var count = 0; count < length; count++) {
      if(options[count]) {
        ans.push(options[count]);
      }
    }
  } else {
    ans.push(options);
  }
  
  // Calculate Score and update it befor save
  var Question = model.Question;
  Question.findOne({ _id: assessment.attemptedDetails[currQuestion].question}, function(error, fullQuestion){
    if(error){
      log.error(error);
      return res.redirect('/test/'+req.test.id+'/'+currQuestion);
    }
    var test = util.compareArray(ans, fullQuestion.answers);
    if(test){
      gotMarks = fullQuestion.weightage.toString();
    }

    // Saving assessment  into database
    Assessment.findOne({ id: assessment.id }, function(error, assessment) {
      assessment.attemptedDetails[currQuestion]['givenAns'] = ans;
      assessment.attemptedDetails[currQuestion]['gotMarks'] = gotMarks;
      assessment.score += parseInt(gotMarks);
      assessment.markModified('attemptedDetails');
      assessment.save(function(error) {
        if(error){
          log.error(error);
          res.redirect('/test/'+req.test.id+'/'+(parseInt(currQuestion)+1));
        }
        currQuestion += 1;
        if(assessment.attemptedDetails.length == currQuestion){
          delete req.session.currQuestion;
          res.redirect('/test/'+req.test.id+'/finish');
        } else {
          req.session.currQuestion = currQuestion;
          req.session.assessment = assessment;
          res.redirect('/test/'+req.test.id+'/'+(parseInt(currQuestion)+1));
        }
      });
    });
  });
};

module.exports.testResult = function(req, res) {
  var Assessment = model.Assessment;
  var test = req.test;
  var user = req.user;
  var assessment = req.session.assessment;
  delete req.session.currQuestion;
  Assessment.findOne({ id: assessment.id }, function(error, assessment){
    res.render('test/attempt/result', {
      assessment: assessment,
      userName: user.name,
      test: test
    });
  }); 
};
