module.exports = function() {};



module.exports.profile = function(req, res){
   log.info(req.user);
  res.render('users/profile', {
  	user: req.user
  });
};