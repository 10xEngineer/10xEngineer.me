var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var model = require('../models');

var util = require('../helpers/util');

module.exports = {};

module.exports.getMiddleware = function(config) {

  // TODO: auto-detect this
  var hostname = 'http://' + config.get('site:hostname');

  // Email-based login
  passport.use(new LocalStrategy({
      usernameField: 'email'
    },
    function(email, password, callback) {
      var User = model.User;

      User.authenticate(email, password, function(error, user) {
        return callback(error, user);
      });
    }
  ));

  // Google
  passport.use(new GoogleStrategy({
      clientID: config.get('auth:google:clientId'),
      clientSecret: config.get('auth:google:clientSecret'),
      callbackURL: hostname + "/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, callback) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;

      callback(null, profile);
    }
  ));

  // Serialize user on login
  passport.serializeUser(function(user, callback) {
    callback(null, user.id);
  });

  // deserialize user on logout
  passport.deserializeUser(function(id, callback) {
    var User = model.User;
    User.findOne({ id: id }, function (error, user) {
      callback(error, user);
    });
  });

  return passport;
};

module.exports.logout = function(req, res, next) {
  req.logOut();
  res.redirect('/');
};

module.exports.local = function(req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
};

module.exports.google = function(req, res, next) {
  passport.authenticate('google', { 
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  })(req, res, next);
};

module.exports.googleCallback = function(req, res, next) {
  passport.authenticate('google', { 
    failureRedirect: '/login'
  },
  function(error, profile, info) {
    if(error) {
      return next(error);
    }

    var User = model.User;

    var email = profile._json.email;
    // Find out if the user is already registered
    User.findOne({ email: email }, function(error, user) {
      if(error) {
        return callback(error);
      }

      if(!user) {
        // User is not registered, save the profile in session and redirect to registration page
        req.session.newUser = {
          name: profile.displayName,
          email: email
        };
        res.redirect('/register');

      } else {
        user.google = profile;

        user.save(function(error) {
          // Establish a session
          req.logIn(user, function(error) {
            if(error) {
              return next(error);
            }

            util.redirectBackOrHome(req, res);
          });
        });
      }
    });
  })(req, res, next);
};