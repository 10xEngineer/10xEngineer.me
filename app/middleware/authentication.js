var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var model = require('../models');

module.exports = function(config) {

  // TODO: auto-detect this
  var hostname = 'htto://' + config.get('site:hostname');

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
      log.info('Google Profile: ', profile);

      // Find out if the user is already registered
      User.findOne({ email: profile.email }, function(error, user) {
        if(error) {
          return callback(error);
        }

        if(!user) {
          // User is not registered, save the profile in session and redirect to registration page
        }
      });
    }
  ));


  // Serialize user on login
  passport.serializeUser(function(user, callback) {
    callback(null, user.id);
  });

  // deserialize user on logout
  passport.deserializeUser(function(id, callback) {
    User.findOne({ id: id }, function (error, user) {
      callback(error, user);
    });
  });

  return passport;
};