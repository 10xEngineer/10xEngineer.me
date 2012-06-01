module.exports = function() {};



module.exports.profile = function(req, res){
   log.info(req.user);
  res.render('users/test', {
  	user: req.user
  });
};