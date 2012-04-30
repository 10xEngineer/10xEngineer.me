var _ = require('underscore');

var Role = load.model('Role');

module.exports.can = function(roles, entity, target, action) {
  return _.filter(roles, function(roleName) {
    Role.findById(roleName, function(error, role) {
      if(error) {
        log.error(error);
        callback(error);
      }

      var matchedPermissions = _.filter(role.permissions, function(permission) {
        var split = permission.split('_');
        log.info(split[0], entity);
        if(split[0] == entity) {
          if(target) {
            log.info(split[1], target);
            if(split[1] == target || split[1] == 'all') {
              log.info(split[2], action);
              return (split[2] == action || split[2] == 'all');
            }
          } else {
            log.info(split[1], action);
            return (split[1] == action || split[1] == 'all');
          }
        }

        return false;
      });

      return (matchedPermissions.length > 0);
    });
  });
}