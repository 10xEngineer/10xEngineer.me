 var model = require('../models');
var fs = require('fs');
var async = require('async');
var importer = require('../helpers/importer');

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
  question.weightage = req.body.weightage;
  question.random = Math.random();
  question.difficulty = req.body.difficulty;
  question.choices = [];
  question.answers = [];


  var optCount = req.body.questionOption.length - 1;
  for (var index = 0; index < optCount; index++) {
    question.choices.push(req.body.questionOption[index]);
    if(req.body.questionOptionCheckbox[index]) {
      question.answers.push(req.body.questionOption[index]);
    }
  };

  // Saves Created Question
  question.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create question.";
      res.redirect('/test/create');
    }

    req.session.message = "Question created successfully.";
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
      log.error(error);
    }
    req.session.message = "Question remove successfully.";
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

module.exports.edit= function(req, res) {
  var question = req.question;
  question.test = req.test._id;
  question.question = req.body.question;
  question.weightage = req.body.weightage;
  question.difficulty = req.body.difficulty;
  choices = [];
  answers = [];

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
      req.session.error = "Can not update question.";
      res.redirect('/test/create');
    }

    req.session.message = "Question saved successfully.";
    res.redirect('/test/' + req.test.id);
  });
};

module.exports.importQuestionView = function(req, res) {  
  res.render('question/questionsImport');
};


module.exports.importQuestion = function(req, res, next) {  
  
  var f = req.files['questions-file'];
  var fileContent = fs.readFileSync(f.path);
  fileContent = fileContent.toString();
  var questionBank = [];
  var fileContentArray = fileContent.split('\t');
  var statesArray = fileContent.split('\n')[0].split('\t');
  var state = statesArray[0];
  var numberOfBlocks = fileContentArray.length;
  var questionUnit = {};
  for (var index = statesArray.length ; index < numberOfBlocks; index++) {
    questionUnit[state] = fileContentArray[index];
    state = nextState(statesArray, state);
    if(isFirstState(statesArray, state)) {
      questionBank.push(questionUnit);
      questionUnit = {};
    }
  };
  req.session.message = "Questions imported successfully.";
  res.redirect('/question/import/1');

};

var nextState = function(array, word) {
  var index = array.indexOf(word);
  if(index >= array.length - 1){
    return array[0];
  } else {
    return array[index+1];
  }
}

var isFirstState = function(array, word){
  if(array.indexOf(word) == 0){
    return true;
  }
  else {
    return false;
  }
}