var model = require('../models');

var util = require('../helpers/util');

module.exports = function() {};

module.exports.login = function(req, res){
  res.render('users/login', {
    title: 'Log In',
    coursenav: "N",
    text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
  });
};

// TODO: Implement
module.exports.signup = function(req, res){
  res.render('users/signup', {
    title: 'Sign Up'
  });
};

module.exports.registerView = function(req, res, next) {
  res.render('users/register');
};

module.exports.register = function(req, res, next) {
  var User = model.User;
  var data = req.body;

  User.create(data, function(error, user) {
    if(error) {
      log.error(error);
      req.session.error = "An error occured while registering.";
      return next(error);
    }

    req.session.message = "Thank you for registering.";
    util.redirectBackOrHome(req, res);
  });
};

module.exports.googleAuthCallback = function(req, res, next) {
  // TODO: Verify
};

module.exports.profile = function(req, res){
  var Course = model.Course;
  
  var progress = req.session.progress;
  var courseIds = [];
  var count = 0;
  for(var key in progress) {
    if(progress.hasOwnProperty(key)) {
      courseIds[count++] = key;
    }
  }
  Course.find({ _id : { $in : courseIds }}, [ 'title'] ,function(error,courses){

    if(error) {
      log.error(error);
    }

    var length = courses.length;
    var formattedProgress = [];
    
    for (var index = 0; index < courses.length; index++) {

      var instanceProgress = {
        courseId     : '',
        courseTitle  : '',
        progress     : ''
      };
      instanceProgress.courseId = courses[index]._id;
      instanceProgress.courseTitle = courses[index].title;
      instanceProgress.progress = progress[courses[index]._id].progress;
      formattedProgress.push(instanceProgress);
    }

    res.render('users/profile', {
      user: req.user,
      progresses : formattedProgress
    }); 
    
  });
   
};

module.exports.settingsView = function(req, res){
  res.render('users/settings', {
    user: req.user
  });
};

module.exports.settings = function(req, res){
  
  var user = req.user;
  user.name = req.body.name;
  user.email = req.body.email;
  user.save(function(error) {
    if(error) {
      log.error(error);
      req.session.error = "Can not save Changes of profile.";
    }

    req.session.message = "Profile updated sucessfully.";
    res.redirect('/user/settings');
  });
};
