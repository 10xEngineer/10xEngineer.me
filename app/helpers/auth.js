var everyauth = require('everyauth');
var User = load.model('User');

var config = load.helper('config').auth;

// TODO: Debug flag. Turn off for production use.
everyauth.debug = true;


module.exports = function () {
  var redirectAction = function(res, data){
    var session = data.session;
    var redirectTo = session.redirectTo;
    delete session.redirectTo;
    log.info(redirectTo);
    if(redirectTo && typeof(redirectTo) == 'string') {
      res.redirect(redirectTo);
    } else {
      res.redirect('/');
    }
  };
  
  // Google
  everyauth.google
    .appId(config.google.clientId)
    .appSecret(config.google.clientSecret)
    .scope('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')
    .entryPath('/auth/google')
    .callbackPath('/auth/google/callback')
    .findOrCreateUser( function (session, accessToken, extra, googleUser) {
      googleUser.refreshToken = extra.refresh_token;
      googleUser.expiresIn = extra.expires_in;

      var promise = this.Promise();
     
      if(session.auth.loggedIn) {
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
    .consumerKey(config.twitter.consumerKey)
    .consumerSecret(config.twitter.consumerSecret)
    .entryPath('/auth/twitter')
    .callbackPath('/auth/twitter/callback')
    .findOrCreateUser( function (session, accessToken, accessSecret, twitUser) {
      var promise = this.Promise();
      
      if(session.auth.loggedIn) {
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
         User.findOrCreate('twitter', twitUser, promise);
      }
     
      return promise;
    })
    .sendResponse(redirectAction);

  // Facebook
  everyauth.facebook
    .appId(config.facebook.appId)
    .appSecret(config.facebook.appSecret)
    .scope('email')
    .entryPath('/auth/fb')
    .callbackPath('/auth/fb/callback')
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
      var promise = this.Promise();
      
      if(session.auth.loggedIn) {
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
    .redirectPath(redirectAction);

  // To inject user object through express middleware
  everyauth.everymodule.findUserById( function (userId, callback) {
    User.findById(userId, callback);
  });

  return everyauth;
}

