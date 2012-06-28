var User = load.model('User');
var Role = load.model('Role');

var _ = require('underscore');


module.exports = function() {};

module.exports.show = function(req, res) {
  User.find(function(error, users) {
    Role.find(function(error, roles) {
      res.render('admin', {
        title: 'Admin',
        users: users,
        roles: roles
      });
    });
  });
};

module.exports.rolesView = function(req, res) {
  Role.find(function (error, roles) {
    res.render('admin/roles', {
      roles: roles
    });    
  });
};

module.exports.showUserRoles = function(req, res){
  Role.find(function (error, roles) {
    log.info("USER::", req.user);
    res.render('admin/user_roles', {
      roles : roles
    });
  });
}

module.exports.updateUserRoles = function(req, res) {
  req.extUser.updateUserRoles(req.body.chngRoles, function(error){
    if(error){
      log.error(error);
    }
    else{
      User.find(function(error, users) {
        Role.find(function(error, roles) {
          res.render('admin', {
            title: 'Admin',
            users: users,
            roles: roles
          });
        });
      });
    }
  })
}

module.exports.newRoleView = function(req, res) {
  res.render('admin/newRole');
};

module.exports.createRoleView = function(req, res) {
  res.render('admin/roleViewForm');
};

module.exports.editRoleView = function(req, res) {
  var roleName = req.route.params['roleName'];
  log.info("REQ.ROUTE.PARAMS['roleName'] :: ", roleName);

  Role.findOne({ name: roleName }, function(error, role){
    if(error){
      log.error(error);
    }
    else {
      var permits = {
        admin_read : false,
        admin_edit : false,
        admin_insert : false,
        admin_delete : false,
        admin_publish : false,        

        user_read : false,
        user_edit : false,
        user_insert : false,
        user_delete : false,
        user_publish : false,        

        course_read : false,
        course_edit : false,
        course_insert : false,
        course_delete : false,
        course_publish : false

      };
      log.info(role.permissions);
  
      for (indx = 0; indx < role.permissions.length; indx++){
        var string = role.permissions[indx];
        string = string.split('_');
        var entity = string[0];
        var allows = string[2];
        if(allows=="all"){
          permits[entity+"_read"] = true;
          permits[entity+"_edit"] = true;
          permits[entity+"_insert"] = true;
          permits[entity+"_delete"] = true;
          permits[entity+"_publish"] = true;
        }
        else {
          permits[entity+"_"+allows] = true;
        }
      }

      log.info(permits);
      res.render('admin/roleViewForm', {
        role : role,
        permits: permits
      });
    }
  })
};

module.exports.createRole = function(req, res) {

  Role.generateRole(req, function(error, role){
    if(error){
      log.error(error);
    }
    else{
      Role.find(function (error, roles) {
        res.render('admin/roles', {
          roles: roles
        });    
      });
    }
  });
}

module.exports.assignRole = function(req, res) {
  var user = req.extUser;
  var roleId = req.params.roleId;

  Role.findById(roleId, function(error, role) {
    if(error) {
      log.error(error);
      res.end('{"success": false}');
    }

    user.roles.push(role.name);
    user.save(function(error) {
      res.end('{"success": true}');
    });
  });
};

/*
module.exports = function(app){
  app.get('/admin/permissions', function(req, res){
    User.findAll(function(users){
      console.log(users);
      res.render('admin/permissions',{
        layout: false
      });
    });
  });
  
  app.get('/admin/user/:id', function(req, res){
    User.findById(parseFloat(req.params.id), function(error, user){
      if(error)
        log.error(error);
      else{
        res.render('admin/user_details',{
          usr:user,
          ability: require('../helpers/ability')
        });
      }
    });
  });
  
  app.post('/admin/user/:id', function(req, res){
    User.findById(parseFloat(req.params.id), function(error, user){
      if(error)
        log.error(error);
      else{
        user.email = req.body.email;
        user.name = req.body.name;
        if(!user.abilities) {
          user.abilities = {};
        }
        user.abilities.role = req.body.role;
        user.abilities.courses = {}; 
        _.each(req.body.abilities, function(value, key){
          user.abilities.courses[key] = value;
        });
        User.updateUser(user, function(error, usr){
          if(error){
            res.json({status:'success'});
          }
          else
          {
            res.json({status:'fail'});
          }
        });
      }
    });
  });
};

*/