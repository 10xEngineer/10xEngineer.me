var model = require('../models');

var util = require('../helpers/util');

module.exports = function() {};

// Miscellaneous routes
module.exports.home = function(req, res){
  res.render('main', {
    title: '10xEngineer.me Home', 
    coursenav: "N",
    Course: '',
    Unit: ''
  });
};

module.exports.about = function(req, res){
  res.render('default', {
    title: '10xEngineer.me About',
    coursenav: "N",
    text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
  });
};

module.exports.registerView = function(req, res) {
  if(req.loggedIn && !req.user.email) {
    res.render('users/register', {
      layout: '',
      title: 'Register'
    });
  } else {
    util.redirectBackOrHome(req, res);
  }
};

module.exports.register = function(req, res, next) {
  var user = model.User;
  
  var email = req.body.email;

  // Check for existing accounts based on current email
  User.findOne({ email: email }, function(error, user) {
    if(error) {
      log.error(error);
      next(error);
    }

    if(!user) {
      // Save email address in current user
      user = req.user;
      user.email = email;
      user.save(function(error) {
        if(error) {
          log.error(error);
          next(error);
        }

        util.redirectBackOrHome(req, res);
      });
    } else {
      // Merge existing user with current user
      var currentUser = req.user;

      var userObj = user.toObject();
      delete userObj._id;
      delete userObj.id;

      currentUser = util.json.merge(currentUser, userObj);
      currentUser.save(function(error) {
        if(error) {
          log.error(error);
          next(error);
        }

        // Delete existing user
        user.remove(function(error) {
          if(error) {
            log.error(error);
            next(error);
          }
  
          util.redirectBackOrHome(req, res);
        });
      });
    }
  });
};