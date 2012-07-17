var model = require('./index');

var statics = {
  findById: function(id, callback) {
    try {
      id = parseInt(id.toString(), 10);
    } catch(error) {
      log.warn('Database migration required');
    }

    this.findOne({ id: id }, callback);
  },

  findOrCreate: function(source, userData, promise) {
    findBySource(source, userData, function(error, dbUser){
      if (error) {
        promise.fail(error);
      }

      if(!dbUser) {
        log.trace('Could not find user!');

        // if no, add a new user with specified info
        createNew(source, userData, function(error, dbUser) {
          if(error) {
            promise.fail(error);
          }
          
          promise.fulfill(dbUser);
        });
      } else {
        // if yes, merge/update the info
        if(!source) {
          promise.fulfill(dbUser);
        } else {
          var now = new Date();
          dbUser[source] = userData;
          dbUser.markModified(source);
          dbUser.modified_at = now.getTime();

          if(!dbUser.name && userData.name) {
            dbUser.name = userData.name;
          }
          if(!dbUser.email && userData.email) {
            dbUser.email = userData.email;
          }

          dbUser.save(function(error) {
            if(error) {
              promise.fail(error);
            }
            promise.fulfill(dbUser);
          });
        }
      }
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
  }
};

// Support functions
var createNew = function(source, userData, callback) {
  var newUser = new User();
  if(userData.name) {
    newUser.name = userData.name;
  }
  if(userData.email) {
    newUser.email = userData.email;
  }

  newUser[source] = userData;
  newUser.save(function(error) {
    if(error) {
      callback(error);
    }

    callback(null, newUser);
  });
};

var findBySource = function(source, userData, callback) {
  var User = model.User;
  var select = {};

  if(source === 'twitter') {
    select['twitter.screen_name'] = userData.screen_name;
  } else if (source === 'google') {
    select.email = userData.email;
  } else if (source === 'facebook') {
    select.email = userData.email;
  }

  User.findOne(select, function(error, dbUser) {
    if (error) {
      callback(error);
    }

    callback(null, dbUser);
  });
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
