
module.exports = function() {};

// Miscellaneous routes
module.exports.home = function(req, res){
  log.info(req.user);
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

module.exports.auth = function(req, res){
  res.render('users/login', {
    title: 'Log In',
    coursenav: "N",
    text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
  });
};

