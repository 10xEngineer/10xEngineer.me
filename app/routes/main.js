
module.exports = function() {};

// Miscellaneous routes
module.exports.home = function(req, res){
  log.info(req.user);
  res.render('main', {
    title: 'Minvy Home'
  });
};

module.exports.about = function(req, res){
  res.render('default', {
    title: 'Minvy About'
  });
};

module.exports.auth = function(req, res){
  res.render('users/login', {
    title: 'Log In'
  });
};

