var User = load.model('User');
var Progress = load.model('Progress');

module.exports = function() {};



module.exports.profile = function(req, res){
  
  Progress.userChapterProgress(req.user, function(error, progress) {
    if(error) {
      log.error(error);
      req.session.error = "Can not fetch a progress report of user.";
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
	log.info("User Changes ", req.body);

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

