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

  var user = { name: '', email: '' };

  if(req.session.newUser) {
    user.name = req.session.newUser.name || user.name;
    user.email = req.session.newUser.email || user.email;
  }

  res.render('users/register',{
    formHeading : "Register",
    user: user
  });
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
    next();
  });
};

module.exports.profile = function(req, res){
  var Progress = model.Progress;
  Progress.userChapterProgress(req.user, function(error, progress) {
    if(error) {
      log.error(error);
      req.session.error = "Can not fetch a progress report of user.";
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
      progressObject : progress
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
