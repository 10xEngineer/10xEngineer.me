module.exports = function(schema, options) {
  schema.pre('save', function(callback) {
    var user = this;
    
    // Assign "default" role to new user
    if(!user.roles || user.roles.length == 0) {
      user.roles.push('default');
    }
    callback();
  });
};
