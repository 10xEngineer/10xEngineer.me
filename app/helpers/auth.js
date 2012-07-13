var everyauth = require('everyauth');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var progress = require('./progress');


// TODO: Debug flag. Turn off for production use.
everyauth.debug = true;


module.exports = function (config) {
  var redirectAction = function(res, data){
    var session = data.session;
    progress.get(session.auth.userId, function(error, progress){
      if(error) {
        log.error(error);
      }
      session.progress = progress;
      res.redirect('/register');
    });
  };
  
  // Google
  everyauth.google
    .appId(config.get('auth:google:clientId'))
    .appSecret(config.get('auth:google:clientSecret'))
    .scope('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')
    .entryPath('/auth/google')
    .callbackPath('/auth/google/callback')
    .findOrCreateUser( function (session, accessToken, extra, googleUser) {
      googleUser.refreshToken = extra.refresh_token;
      googleUser.expiresIn = extra.expires_in;

      var promise = this.Promise();
     
      if(session.auth && session.auth.loggedIn) {
        User.findById(session.auth.userId, function(error, dbUser) {

          dbUser.google = googleUser;
          dbUser.markModified('google');
          
          dbUser.save(function(error) {
            if(error) {
              promise.fail(error);
            }
          promise.fulfill(dbUser);
          });
        });
      } else {
        User.findOrCreate('google', googleUser, promise);
      }
      return promise;
    })
    .sendResponse(redirectAction);

  // Twitter
  everyauth.twitter
    .consumerKey(config.get('auth:twitter:consumerKey'))
    .consumerSecret(config.get('auth:twitter:consumerSecret'))
    .entryPath('/auth/twitter')
    .callbackPath('/auth/twitter/callback')
    .findOrCreateUser( function (session, accessToken, accessSecret, twitUser) {
      var promise = this.Promise();
      
      if(session.auth && session.auth.loggedIn) {
        User.findById(session.auth.userId, function(error, dbUser) {

          dbUser.twitter = twitUser;
          dbUser.markModified('twitter');
          
          dbUser.save(function(error) {
            if(error) {
              promise.fail(error);
            }
          promise.fulfill(dbUser);
          });
        });
      } else {
        // Email hack

        // Store twitter user info into the database and set the flag
        session.regWizard = {
          email: false
        };

        User.findOrCreate('twitter', twitUser, promise);
      }
     
      return promise;
    })
    .sendResponse(redirectAction);

  // Facebook
  everyauth.facebook
    .appId(config.get('auth:facebook:appId'))
    .appSecret(config.get('auth:facebook:appSecret'))
    .scope('email')
    .entryPath('/auth/fb')
    .callbackPath('/auth/fb/callback')
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
      var promise = this.Promise();
      
      if(session.auth && session.auth.loggedIn) {
        User.findById(session.auth.userId, function(error, dbUser) {

          dbUser.facebook = fbUserMetadata;
          dbUser.markModified('facebook');
          
          dbUser.save(function(error) {
            if(error) {
              promise.fail(error);
            }
          promise.fulfill(dbUser);
          });
        });
      } else {
       User.findOrCreate('facebook', fbUserMetadata, promise);
     }
      return promise;
    })
    .sendResponse(redirectAction);

  // To inject user object through express middleware
  everyauth.everymodule.findUserById( function (userId, callback) {
    User.findById(userId, callback);
  });

  return everyauth;
}

