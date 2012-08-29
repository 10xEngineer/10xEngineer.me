var bcrypt = require('bcrypt');

var model = require('./index');

var statics = {
  createOrUpdate: function(data, callback) {
    var User = this;

    if(!data || !data.email || !data.password) {
      return callback(new Error('Missing required fields'));
    }

    User.findOne({ email: data.email }, function(error, dbUser) {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(data.password, salt, function(error, hash) {
          var newUser;
          if(dbUser) {
            newUser = dbUser;
          } else {
            newUser = new User();
          }
          
          newUser.email = data.email;
          newUser.hash = hash;

          if(data.provider) {
            newUser[data.provider] = data.profile;
            newUser.markModified(data.provider);
          }
          
          if(data.name) {
            newUser.name = data.name;
          }
          
          newUser.email = data.email;
          newUser.hash = hash;

          if(data.provider) {
            newUser[data.provider] = data.profile;
            newUser.markModified(data.provider);
          }
          
          if(data.name) {
            newUser.name = data.name;
          }

          newUser.save(function(error) {
            if(error) {
              callback(error);
            } else {
              User.findOne({ id: newUser.id }, callback);
            }
          });
        });
      });
      
    });
  },

  authenticate: function(email, password, callback) {
    var User = this;
    
    User.findOne({ email: email }, function(err, user) {
      if (err) { return callback(err); }
      if (!user) {
        return callback(null, false, { message: 'Unknown user' });
      }
      user.verifyPassword(password, function(error, verified) {
        if(error) {
          return callback(error);
        }
        if(!verified) {
          callback(null, false, { message: 'Invalid password' });          
        } else {
          callback(null, user);
        }
      });
    });
  }
};

var methods = {
  updateUserRoles: function(roles, callback){
    this.roles = roles;
    this.save(function(error){
      if(error){
        log.error(error);
      }
    });
    callback();
  },

  verifyPassword: function(password, callback) {
    var user = this;
    bcrypt.compare(password, this.hash, callback);
  }
};


module.exports = {
  name: 'User',
  schema: require('./schema/user'),
  options: {
    methods: methods,
    statics: statics,
    plugins: ['id', 'timestamp', 'user']    
  }
};
