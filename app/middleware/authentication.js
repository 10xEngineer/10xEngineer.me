var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

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

      User.authenticate(email, password, callback);
    }
  ));

  // Google
  passport.use(new GoogleStrategy({
      clientID: config.get('auth:google:clientId'),
      clientSecret: config.get('auth:google:clientSecret'),
      callbackURL: hostname + '/auth/google/callback'
    },
    function(accessToken, refreshToken, profile, callback) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;

      callback(null, profile);
    }
  ));

  // Facebook
  passport.use(new FacebookStrategy({
      clientID: config.get('auth:facebook:appId'),
      clientSecret: config.get('auth:facebook:appSecret'),
      callbackURL: hostname + '/auth/fb/callback'
    },
    function(accessToken, refreshToken, profile, callback) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;

      callback(null, profile);
    }
  ));

  // Twitter
  passport.use(new TwitterStrategy({
      consumerKey: config.get('auth:twitter:consumerKey'),
      consumerSecret: config.get('auth:twitter:consumerSecret'),
      callbackURL: hostname + '/auth/twitter/callback'
    },
    function(token, tokenSecret, profile, callback) {
      profile.token = token;
      profile.tokenSecret = tokenSecret;

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
    User.findOne({ id: id }, callback);
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
    failureRedirect: '/auth',
    failureFlash: 'Invalid Email or Password.'
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
    failureRedirect: '/auth'
  },
  function(error, profile, info) {
    if(error) return next(error);

    var User = model.User;

    var email = profile._json.email;
    // Find out if the user is already registered
    User.findOne({ email: email }, function(error, user) {
      if(error) return next(error);

      if(!user || !user.hash) {
        // User is not registered, save the profile in session and redirect to registration page
        req.session.newUser = {
          name: profile.displayName,
          email: email,
          provider: 'google',
          profile: profile._json
        };
        res.redirect('/register');

      } else {
        user.google = profile;
        user.markModified('google');

        user.save(function(error) {
          if(error) return next(error);

          // Establish a session
          req.logIn(user, function(error) {
            if(error) return next(error);

            util.redirectBackOrHome(req, res);
          });
        });
      }
    });
  })(req, res, next);};

module.exports.facebook = function(req, res, next) {
  passport.authenticate('facebook', {
    scope: 'email'
  })(req, res, next);
};

module.exports.facebookCallback = function(req, res, next) {
  passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/auth'
  },
  function(error, profile, info) {
    if(error) return next(error);

    var User = model.User;

    var email = profile._json.email;
    // Find out if the user is already registered
    User.findOne({ email: email }, function(error, user) {
      if(error) return next(error);

      if(!user || !user.hash) {
        // User is not registered, save the profile in session and redirect to registration page
        req.session.newUser = {
          name: profile.displayName,
          email: email,
          provider: 'facebook',
          profile: profile._json
        };
        res.redirect('/register');

      } else {
        user.facebook = profile;
        user.markModified('facebook');

        user.save(function(error) {
          if(error) return next(error);

          // Establish a session
          req.logIn(user, function(error) {
            if(error) return next(error);

            util.redirectBackOrHome(req, res);
          });
        });
      }
    });
  })(req, res, next);
};

module.exports.twitter = function(req, res, next) {
  passport.authenticate('twitter')(req, res, next);
};

module.exports.twitterCallback = function(req, res, next) {
  passport.authenticate('twitter', {
    successRedirect: '/',
    failureRedirect: '/auth'
  },
  function(error, profile, info) {
    if(error) return next(error);

    var User = model.User;

    var username = profile.username;
    // Find out if the user is already registered
    User.findOne({ 'twitter.screen_name': username }, function(error, user) {
      if(error) return next(error);

      if(!user || !user.email || !user.hash) {
        // User is not registered, save the profile in session and redirect to registration page
        req.session.newUser = {
          name: profile.displayName,
          provider: 'twitter',
          profile: profile._json
        };
        res.redirect('/register');

      } else {
        user.twitter = profile;
        user.markModified('twitter');

        user.save(function(error) {
          if(error) return next(error);

          // Establish a session
          req.logIn(user, function(error) {
            if(error) return next(error);

            util.redirectBackOrHome(req, res);
          });
        });
      }
    });
  })(req, res, next);
};
