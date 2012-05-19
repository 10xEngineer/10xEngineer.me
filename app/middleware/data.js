var User = load.model('User');

module.exports = function(app) {

  // User
  app.param('userId', function(req, res, next, id){
    User.findById(id, function(error, user) {
      if(error) {
        next(error);
      }

      if(user) {
        req.extUser = user;
        req.app.helpers({
          extUser: user
        });
      }

      next();
    });
  });
};
