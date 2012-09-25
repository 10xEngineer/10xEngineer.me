var model = require('./index');


var statics = {
  createRole: function(newName, newPermissions, callback) {
    var Count = model.Count;
    var Role = this;

    var curRole = new Role();
    curRole.name = newName;
    Count.getNext('roles', function(error, newId){
      if(error) return callback(error);

      curRole.id = newId;
      curRole.permissions = newPermissions;

      curRole.save(function(error){
        if(error) return callback(error);
        callback(null, curRole);
      });
    });
  }
};

var methods = {
  removeRole: function(callback) {
    var role = this;
    role.remove(callback);
  },

  modifyRole: function(newName, newPermissions, callback) {
    var role = this;
    role.name = newName;
    role.permissions = newPermissions;
    role.save(callback);
  }
};


module.exports = {
  name: 'Role',
  schema: require('./schema/role'),
  options: {
    methods: methods,
    statics: statics,
    plugins: ['id', 'timestamp']    
  }
};
