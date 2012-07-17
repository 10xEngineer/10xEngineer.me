module.exports = function(name) {
  return function(schema, options) {
    schema.pre('save', function(next) {
      var user = this;
      
      // Assign "default" role to new user
      if(!user.roles || user.roles.length == 0) {
        user.roles.push('default');
      }
    });
  };
};


