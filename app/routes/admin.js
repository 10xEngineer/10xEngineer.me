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

module.exports.newRoleView = function(req, res) {
  res.render('admin/newRole');
};

module.exports.createRole = function(req, res) {
  
};

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

