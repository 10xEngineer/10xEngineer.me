var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var Role = mongoose.model('Role');

module.exports.can = function(roles, entity, target, action, callback) {
  var matched = false;
  async.forEach(roles, function(roleName, callback) {
    Role.findOne({ name: roleName }, function(error, role) {
      if(error) {
        log.error(error);
        return false;
      }

      var matchedPermissions = _.filter(role.permissions, function(permission) {
        var split = permission.split('_');
        if(split[0] == entity) {
          if(target) {
            if(split[1] == target || split[1] == 'all') {
              return (split[2] == action || split[2] == 'all');
            }
          } else {
            return (split[1] == action || split[1] == 'all');
          }
        }

        return false;
      });

      matched = matched || matchedPermissions.length > 0;
      callback();
    });
  },
  function(error) {
    callback(matched);
  });
}