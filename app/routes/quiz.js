var model = require('../models');

var util = require('../helpers/util');

var async = require('async');

// Quiz List
module.exports.quizList = function(req, res) {
  var Quiz = model.Quiz;
  Quiz.find({}, function(error, quizs){
    if(error){
      log.error("Quiz could not be fetched.");
      res.redirect('/');
    }
    res.render('quiz', {
      title: "Quiz List",
      quizs: quizs
    })
  })
};

// Quiz Create
module.exports.createView = function(req, res) {
	var quiz = {
    title: "",
		mark: "",
		desc: "",
		type: "quiz"
	};
	res.render('quiz/create',{
		title: "Quiz",
		quiz : quiz,
    edit: false
	});
};

module.exports.create = function(req, res) {
  var Quiz = model.Quiz;

  var quiz = new Quiz();
  quiz.title = req.body.title;
  quiz.mark = req.body.mark;
  quiz.desc = req.body.description;
  quiz.type = req.body.type;

  // Saves Created Quiz
  quiz.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not create quiz.";
      res.redirect('/assessment/quiz/create');
    }

    req.session.message = "Quiz created successfully.";
    res.redirect('/assessment/quiz/' + quiz.id);
  });
};

// Quiz Edit
module.exports.editView = function(req, res) {
  var quiz = req.quiz;
  res.render("quiz/edit",{
    title: "Quiz",
    quiz: quiz,
    edit: true
  });
};

module.exports.edit = function(req, res) {
  
  var quiz = req.quiz;
  quiz.title = req.body.title;
  quiz.mark = req.body.mark;
  quiz.desc = req.body.description;
  quiz.type = req.body.type;

  quiz.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not Update quiz.";
      res.redirect('/assessment/quiz');
    }
    req.session.message = "Question saved successfully.";
    res.redirect('/assessment/quiz');
  });

};

// Quiz Remove
module.exports.removeQuiz = function(req, res) {
  var quiz = req.quiz;
  
  quiz.remove(function(error){
    if(error){
      log.error(error);
    }
    req.session.message = "Quiz remove successfully.";
    res.redirect("/assessment/quiz");
  });
};

// Quiz Details
module.exports.view = function(req, res) {
  var Question = model.Question;
  var Quiz = model.Quiz;
  Question.find({ quiz: req.quiz._id }, function(error, questions) {
    if(error){
      log.error("Error: ", error);
      redirect('/assessment/quiz');
    }
    res.render('quiz/view', {
      title:  "Quiz",
      quiz: req.quiz,
      questions: questions
    });
  });
};

// Quiz Start :: 
module.exports.startQuiz = function(req, res) {
  var Assessment  = model.Assessment;
  var Question    = model.Question;
  var lesson      = req.lesson;
  var quiz        = req.lesson.quiz;
  var lessonId    = lesson._id;

  if(req.session.currQuestion) {
    delete req.session.currQuestion;
  }
   
  generateQuestionPaper(lesson, function(error, questionPaper){

    questionPaper               = util.randomizeArray(questionPaper); 
    var assessment              = new Assessment();
    assessment.lesson.id        = lessonId;
    assessment.lesson.title     = lesson.title;
    assessment.lesson.marks     = lesson.quiz.marks;
    assessment.user.id          = req.user._id;
    assessment.user.name        = req.user.name;
    assessment.score            = 0;
    if(questionPaper.length>0) {
      assessment.attemptedDetails = questionPaper;
    } else {
      return res.redirect('/lesson/'+lesson.id);
    }
    assessment.save(function(error){
      if(error){
        log.error(error);
      return res.redirect('/lesson/'+lesson.id);
      }
      req.session.assessment   = assessment;
      req.session.currQuestion = 0;

      res.redirect("/assessment/quiz/"+lesson.id+"/1");
    });
  });
};


module.exports.continueQuiz = function(req, res) {
  var Assessment  = model.Assessment;
  var lesson = req.lesson;
  Assessment.findOne({ "lesson.id" : lesson._id}, function(error, assessment){
    var attemptedDetails = assessment.attemptedDetails;
    var len = attemptedDetails.length;
    for(var i = 0; i < len; i++){
      if(attemptedDetails[i].hasOwnProperty('givenAns')) continue;
      else break;
    }
    res.redirect("/assessment/quiz/"+lesson.id+"/"+(i+1));
  });
}

// 
var generateQuestionPaper = function(lesson, callback) {
  
  var mark = lesson.quiz.marks;
  // Todo : All logic is remaining  :p
  var questionPaper     = [];
  var easyWeight        = mark * 0.4;
  var midWeight         = mark * 0.4;
  var hardWeight        = mark * 0.2;
  var noOfHardQuestions = parseInt(hardWeight/3);
  var noOfMidQuestions;
  var noOfEasyQuestions;
  var collectedWeight;

  var noOfCollectedQuestions = 0;
  getQuestions(lesson._id, noOfHardQuestions, 3, function(error, hardQuestions){
    if(error){
      callback(error);
    }
    collectedWeight = hardQuestions.length * 3;
    midWeight = (parseInt(midWeight+hardWeight - (collectedWeight)));
    noOfMidQuestions = parseInt(midWeight/2);
    questionPaper = questionPaper.concat(hardQuestions);
    getQuestions(lesson._id, noOfMidQuestions, 2, function(error, midQuestions){
      if(error){
        callback(error);
      }
      collectedWeight += midQuestions.length * 2;
      easyWeight = (parseInt(mark - (collectedWeight)));
      noOfEasyQuestions = parseInt(easyWeight);
      questionPaper = questionPaper.concat(midQuestions);
      getQuestions(lesson._id, noOfEasyQuestions, 1, function(error, easyQuestions){
        if(error){
          callback(error);
        }
        collectedWeight += easyQuestions.length ;
        questionPaper = questionPaper.concat(easyQuestions);
        callback(null, questionPaper);
      });  
    });
  });


}

// 
var getQuestions = function(lesson_id, noOfQuestions, difficulty, callback) {
  
  // Difine variables 
  var Question            = model.Question;
  var rand                = Math.random();
  var direction           = (rand>0.5) ? '$gte': '$lt' ;
  var order               = direction == '$lt' ? 1 : -1;
  var random              = {};
  var resultQuestionsSet  = [];
  var randStr             = rand.toString();
  var data                = {};

  // randStr = randStr.substring(0,6);
  // rand = parseFloat(randStr, 10);
  random[direction] = rand;
  
  //data['difficulty'] = (difficulty != 3) ? difficulty: { '$gte' : difficulty};
  data['difficulty'] = difficulty;
  data['random'] = random;
  data['lesson'] = lesson_id;
  data['limit']  = noOfQuestions;
  data['order']  = order;
  data['questionList'] = [];

  getSingleSideQuestions(data, function(err, questions){
    if(err){
      callback(err);
    }
    if(questions.length < noOfQuestions) {
      direction = (direction=='$gte') ? '$lt': '$gte';
      order = direction == '$lt' ? 1 : -1;
      random = {};
      random[direction] = rand;

      data['random'] = random;
      data['limit']  = noOfQuestions - questions.length;
      data['order']  = order;
      data['questionList'] = questions
 
      getSingleSideQuestions(data, function(err, questions){
        if(err){
          callback(err);
        }
        callback(null, questions)
      });
    }
    else {
      callback(null, questions)
    }
  });
};

var getSingleSideQuestions = function (data, callback) {
  var Question = model.Question;
  Question.find({points : data.difficulty, random: data.random, lesson: data.lesson }, { _id : 1})
    .sort('random', data.order )
    .limit(data.limit)
    .exec(function(error, questions){
      if(error) {
        callback(error);
      }
      var questionList = data.questionList;
      for (var index = 0; index < questions.length; index++) {
        var sampleQuestion = {}; 
        sampleQuestion['question'] = questions[index]._id.toString();
        questionList.push(sampleQuestion);
      }
      callback(null, questionList);
    });
};

// Question View
module.exports.viewQuestion = function(req, res) {

  var Question          = model.Question;
  var questionIndex     = req.questionIndex;
  var assessment        = req.session.assessment;
  var attemptedDetails  = assessment.attemptedDetails;

  var currQuestion = req.session.currQuestion;

  if(questionIndex>currQuestion || questionIndex<0) {
    req.session.error = "You are not permit to move at that question";
    return res.redirect('/assessment/quiz/'+req.lesson.id+"/"+(parseInt(currQuestion)+1));
  }

  Question.findOne({ _id: attemptedDetails[questionIndex].question}, function(error, question) {
    if(error){
      log.error(error);
      res.redirect('/assessment/quiz');
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
      lessonId: req.lesson.id,
      displayedQuestionIndex: questionIndex,
      currQuestionIndex: currQuestion
    };
    var Lesson = model.Lesson;
    question.choices = util.randomizeArray(question.choices);
    Lesson.find({}, function(error, allLessons) {
      res.render('quiz/attempt/question', {
        title : req.lesson.title,
        course: req.course,
        allLessons: allLessons,
        question: question, 
        givenAns: givenAns,
        controls: controls
      });
    });
  });
};

// 
module.exports.submitQuestion = function(req, res) {
  var Assessment    = model.Assessment;
  var assessment    = req.session.assessment;
  var currQuestion  = req.session.currQuestion;
  var options       = req.body.questionOption;
  var length        = options.length;
  var gotMarks      = 0;
  var ans           = [];
  var status        = 'attempted';

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
      return res.redirect('/assessment/quiz/'+req.lesson.id+'/'+currQuestion);
    }
    if(fullQuestion.choices.length>1 && util.compareArray(ans, fullQuestion.answers)){
      gotMarks = fullQuestion.weightage.toString();
      status   = 'assessed';
    }
    log.info(req.session.assessedQust);
    // Saving assessment  into database
    Assessment.findOne({ id: assessment.id }, function(error, assessment) {
      assessment.attemptedDetails[currQuestion]['givenAns'] = ans;
      assessment.attemptedDetails[currQuestion]['gotMarks'] = gotMarks;
      assessment.attemptedDetails[currQuestion]['status'] = status;
      assessment.score += parseInt(gotMarks);
      assessment.markModified('attemptedDetails');
      assessment.save(function(error) {
        if(error){
          log.error(error);
          res.redirect('/assessment/quiz/'+req.lesson.id+'/'+(parseInt(currQuestion)+1));
        }
        currQuestion += 1;
        if(assessment.attemptedDetails.length == currQuestion){
          delete req.session.currQuestion;
          res.redirect('/assessment/quiz/'+req.lesson.id+'/finish');
        } else {
          req.session.currQuestion = currQuestion;
          req.session.assessment = assessment;
          res.redirect('/assessment/quiz/'+req.lesson.id+'/'+(parseInt(currQuestion)+1));
        }
      });
    });
  });
};

// 
module.exports.quizResult = function(req, res) {
  var Progress = model.Progress;
  var Assessment = model.Assessment;
  var Lesson = model.Lesson;
  var quiz = req.lesson.quiz;
  var lesson = req.lesson;
  var user = req.user;
  var assessment = req.session.assessment;
  delete req.session.currQuestion;
  Assessment.findOne({ id: assessment.id }, function(error, assessment){
    var details = assessment.attemptedDetails;
    var assessed = true;
    for (var index = 0; index < details.length; index++) {
      if(details[index].status != 'assessed'){
        assessed = false;
        break;
      };
    };
    if(assessed) {
      assessment.status = 'assessed';
      assessment.save(function(err){
        if(err){
          console.log(err);
        }
        console.log("Seved successfully");
      });
    }
    Progress.getProgress(user, req.course, function(error, progress) {
      if(error) {
        log.error(error);
      }
      if(progress.status != 'completed') {
        // Start the Lesson : Change status of lesson to 'ongoing'
        progress.completeLesson(lesson, function(error) {
          if(error) {
            log.error(error);
          }
        });
      }
    });
    res.redirect('/lesson/'+lesson.id);
  }); 
};

module.exports.examin = function(req, res) {
  var Assessment = model.Assessment;
  Assessment.find({status: 'inProgress'}, function(err, assessments){
    res.render('quiz/examiner/quizList', {
      assessments : assessments
    });
  });
};

module.exports.startExamin = function(req, res) {
  var Question = model.Question;
  var assessment = req.assessment;
  req.session.currQuestion = 0;

  var questionList = [];
  var attemptedDetails = assessment.attemptedDetails;
  for(var i = 0; i < attemptedDetails.length; i++){
    questionList.push(attemptedDetails[i].question);
  };

  Question.find({ _id: { $in: questionList}}, function(err, fullQuestionList){
    
    for(var i = 0; i < fullQuestionList.length; i++){
      if(fullQuestionList[i].choices.length == 1) {
        continue;
      } else {
        fullQuestionList.splice(i,1);
        i--;
      }
    };
    req.session.essayQuestionList = fullQuestionList;
    req.session.currQuestion      = 0;
    res.redirect('/assessment/quiz/examin/'+req.assessment.id+'/1');
  });
};

module.exports.showQuestionToExaminer = function(req, res) {
  var Question          = model.Question;
  var assessment        = req.assessment;
  var currQuestion      = req.questionIndex;
  var attemptedDetails  = assessment.attemptedDetails;
  var length            = attemptedDetails.length;
  var question          = req.session.essayQuestionList[currQuestion];

  res.render('quiz/examiner/question', {
    currQuestion : currQuestion,
    assessment   : assessment,
    question     : question
  });
};

module.exports.submitAssessmentMarks = function(req, res) {
  var Assessment = model.Assessment;
  var marks = req.body.marks;
  var assessment = req.assessment;

  Assessment.findOne({ id: assessment.id}, function(err, assessment){
    var details = assessment.attemptedDetails;
    var question = req.session.essayQuestionList[req.session.currQuestion];
    var assessmentQN;
    for (var i = 0; i < details.length; i++) {
      if(question._id == details[i].question){
        assessmentQN = i;
        break;
      }
    };
    assessment.attemptedDetails[assessmentQN]['gotMarks'] = marks;
    assessment.markModified('attemptedDetails');
    assessment.save(function(error) {
      if(error){
        log.error(error);
        res.redirect('/assessment/quiz/'+assessment.id+'/'+(parseInt(currQuestion)+1));
      }
      var currQuestion = req.session.currQuestion + 1;
      if(assessment.attemptedDetails.length == currQuestion){
        delete req.session.currQuestion;
        res.redirect('/assessment/quiz/examin');
      } else {
        req.session.currQuestion = currQuestion;
        req.session.assessment = assessment;
        res.redirect('/assessment/quiz/examin/'+assessment.id+'/'+(parseInt(currQuestion)+1));
      }
    });
  });
};