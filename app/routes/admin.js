var User = load.model('User');
var Role = load.model('Role');

var _ = require('underscore');


module.exports = function() {};

module.exports.show = function(req, res) {
  res.render('admin');
};

module.exports.rolesView = function(req, res) {
  Role.find(function (error, roles) {
    res.render('admin/roles', {
      roles: roles
    });    
  });
};

module.exports.newRoleView = function(req, res) {
  res.render('admin/newRole');
};

module.exports.createRole = function(req, res) {
  
}

module.exports = function(app){
  app.get('/admin/permissions', function(req, res){
    User.findAll(function(users){
      console.log(users);
      res.render('admin/permissions',{
        layout: false
      });
    });
  })
  
  app.get('/admin/user/:id', function(req, res){
    User.findById(parseFloat(req.params.id), function(error, user){
      if(error != null)
        log.error(error);
      else{
        res.render('admin/user_details',{
          usr:user,
          ability: require('../helpers/ability')
        });
      }
    })
  });
  
  app.post('/admin/user/:id', function(req, res){
    User.findById(parseFloat(req.params.id), function(error, user){
      if(error != null)
        log.error(error);
      else{
        user.email = req.body.email;
        user.name = req.body.name;
        if(user.abilities == undefined || user.abilities == null)
          user.abilities = {};
        user.abilities.role = req.body.role;
        user.abilities.courses = {}; 
        _.each(req.body.abilities, function(value, key){
          user.abilities.courses[key] = value;
        });
        User.updateUser(user, function(error, usr){
          if(error == null){
            res.json({status:'success'});
          }
          else
          {
            res.json({status:'fail'});
          }
        })
      }
    })
  })
}