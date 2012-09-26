var redis = require("redis");
var nodemailer = require("nodemailer");
var config = require('../config/config');
var model = require('../models');
var util = require('../helpers/util');
var templet = require('../helpers/templet');

module.exports = function() {};
module.exports.login = function(req, res, next){
  var error = req.app.locals.error;
  if(error != "") {
    res.render('users/login', {
      error: error,
      title: 'Log In',
      coursenav: "N",
      text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
    });
  } else {
    res.render('users/login', {
      title: 'Log In',
      coursenav: "N",
      text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
    });
  }
};

// TODO: Implement
module.exports.signup = function(req, res, next){
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
  var newUser = req.session.newUser;

  if(newUser) {
    var provider = newUser.provider;
    data.provider = provider;
    data.profile = newUser.profile;
  }

  User.createOrUpdate(data, function(error, user) {
    if(error) return next(error);

    req.session.message = "Thank you for registering.";
    next();
  });
};

module.exports.profile = function(req, res, next){
  var Progress = model.Progress;
  Progress.userChapterProgress(req.user, function(error, progress) {
    if(error) return next(error);
    res.render('users/profile', {
      user: req.user,
      progressObject : progress
    });
  }); 
};

module.exports.settingsView = function(req, res, next){
  res.render('users/settings', {
    user: req.user
  });
};

module.exports.settings = function(req, res, next){
  var user = req.user;
  var oldPassword = req.body.oldPassword;
  var newPassword = req.body.newPassword;
  var cnfrmPassword = req.body.cnfrmPassword;
  user.verifyPassword(oldPassword, function(error, verified){
    if(error) return next(error);
    if(verified){
      if(newPassword != cnfrmPassword) {
        req.session.error = "New password and Confirm password are not same.";
        return res.redirect('/user/settings');
      } else if(newPassword == ""){
        req.session.error = "Empty password not allowed.";
        return res.redirect('/user/settings');
      } else {
        var data = {
          email: user.email,
          password: newPassword
        }
        user.changePassword(data, function(error, user){
          if(error) return next(error);
          req.session.message = "Password Changed Successfully.";
          user.name = req.body.name;
          user.email = req.body.email;
          user.save(function(error) {
            if(error) return next(error);
            req.session.message = "Profile updated sucessfully.";
            return res.redirect('/user/profile');
          });
        });
      }
    } else {
      if(oldPassword==""){
        user.name = req.body.name;
        user.email = req.body.email;
        user.save(function(error) {
          if(error) return next(error);
          req.session.message = "Profile updated sucessfully.";
          return res.redirect('/user/profile');
        });
      } else {
        req.session.error = "Incorrect old password";
        res.redirect('/user/settings');
      }
    }
  });
};

module.exports.forgotPassword = function(req, res, next) {
  return res.render('users/forgotPass');
}

module.exports.mailLinkForResetPassword = function(req, res, next) {
  var User = model.User;
  var email = req.body.email;
  User.findOne({ email: email}, function(error, user){
    if(error) return next(error);
    if(!user) {
      req.session.message = "No user Found";
      return res.redirect('/auth/forgot_password');
    }
    else {


      var client = redis.createClient();
      var randStr = util.string.random(32);
      client.setex(randStr, 86400, user._id);   // 24 hourse = 86,400 seconds
      console.log(randStr);
      var host = config.get('site:hostname');
      templet.getHtmlTemplate("forgotPass", { "name" : user.name, "link": "http://"+host+"/passwordRecover?resetId="+randStr }, function(error, htmlText){
        if (error) return next(error);

        var hostMailID    = config.get('mail:username');
        var hostMailPass  = config.get('mail:password');

        // create reusable transport method (opens pool of SMTP connections)
        var smtpTransport = nodemailer.createTransport("SMTP",{
          service: "Gmail",
          auth: {
              user: hostMailID,    // Sender mail id here
              pass: hostMailPass   // password
          }
        });
        // setup e-mail data with unicode symbols
        var mailOptions = {
          from: "", // sender address
          to: user.name + " <" + user.email + ">", // list of receivers
          subject: "10xEngineer : Password Recovery", // Subject line
          text: "", // plaintext body
          html: htmlText //fs.readFileSync(templetPath).toString() // html body
        };

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, responce){
          if(error) return next(error);
          console.log("Message sent: " + responce.message);
          // if you don't want to use this transport object anymore, uncomment following line
          //smtpTransport.close(); // shut down the connection pool, no more messages
          req.session.message = "Link sent to your email-id Check it out.";
          return res.redirect('/');
        });
      });
    }
  });
}

module.exports.resetPasswordView = function(req, res, next) {
  var randStr = req.query.resetId;
  var client = redis.createClient();
  var User = model.User;
  client.get(randStr, function(error, reply){
    User.findOne({_id:reply}, function(error, user) {
      if(error || user == null) {
        req.session.message = "Password Recovery timeout."
        return res.redirect('/');
      }
      return res.render('users/resetPassword');
    });
  });  
}

module.exports.resetPassword = function(req, res, next) {
  var randStr = req.query.resetId;
  var client = redis.createClient();
  var User = model.User;
  var pass = req.body.password;
  var cpass= req.body.confirmPassword;

  client.get(randStr, function(error, reply){
    if(error) return next(error);
    User.findOne({_id:reply}, function(error, user) {
      if(error){
        req.session.error = "Error in find user."
        return res.redirect('/');
      }
      if(user == null) {
        req.session.message = "Password Recovery timeout."
        return res.redirect('/');
      }
      if(pass == cpass){
        var data = {
          email: user.email,
          password: pass
        }
        user.changePassword(data, function(error, user){
          if(error) return next(error);
          req.session.message = "Password Changed Successfully.";
          return res.redirect('/auth');
        });
      }
      else {
        req.session.message = "Both password are not same.";
        return res.redirect('/passwordRecover?resetId='+randStr);
      }
    });
  });  
}