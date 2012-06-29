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

  var roleId = parseInt(req.route.params['roleId']);

  Role.findOne({ id: roleId }, function(error, role){
    var roleName = role.name;
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

      res.render('admin/roleViewForm', {
        role : role,
        permits: permits
      });
    }
  })
};

module.exports.editRole = function(req, res) {

  var modifiedRoleName = req.body.name;
  var roleId = parseInt(req.route.params['roleId']);
  getPermissionListForRole(req, function(error, modifiedRolePermits){
    if(!error){
      Role.findOne({ id : roleId }, function(error, role){
        role.modifyRole(modifiedRoleName, modifiedRolePermits, function(error){
          if(error){
            log.error(error);
          }
          res.redirect('/admin/roles');
        })
      })
    }
  })
}

module.exports.createRole = function(req, res) {

  var newRoleName = req.body.name;

  getPermissionListForRole(req, function(error, newRolePermits){
    Role.generateRole(newRoleName, newRolePermits, function(error, role){
      if(error){
        log.error(error);
      }
      else{
        res.redirect('/admin/roles');
      }
    });
  })
}

module.exports.removeRole = function(req, res) {
  var roleId = parseInt(req.route.params['roleId']);
  Role.findOne({ id : roleId}, function(error, role){
    if(error){
      log.error(error);
    }
    else {
      role.removeRole(function(error){
        if(error){
          log.error(error);
        }
        res.redirect('/admin/roles');
      });
    }
  })
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

var getPermissionListForRole = function(req, callback) {
  var newRolePermits = [];

  var entities = ['admin', 'user', 'course'];
  var allowes = ['read', 'edit', 'insert', 'delete', 'publish'];

  for (eIndx = 0; eIndx < entities.length; eIndx++){
    var entity = entities[eIndx];
    var entity_all = false;
    var count = 0;
    var entity_per_arr=[];
    for(pIndx = 0; pIndx < allowes.length; pIndx++){
      var allow = allowes[pIndx];
      permitString = entity + "_" + allow;
      if(typeof(req.body[permitString]) != 'undefined') { // Checked
        entity_per_arr.push(entity+"_all_"+allow);
        count++;
      }
    }
    if(count == allowes.length){   // found all checked for this entity
      newRolePermits.push(entity+"_all_all");
    }
    else {  // join prepared array
      newRolePermits = newRolePermits.concat(entity_per_arr);
    }
  }
  callback(null, newRolePermits);
}

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