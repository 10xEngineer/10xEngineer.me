var db = require('../helpers/database').db;

module.exports = {
  collection: db.collection('users')
};

module.exports.findById = function(id, callback) {

  this.collection.findOne({id: id}, function(error, dbUser) {
    if (error) {
      return callback(error);
    }

    log.info('findById called');
    callback(null, dbUser);
  });
};

module.exports.findBySource = function(source, srcUser, callback) {

  var select = {};

  if(source === 'twitter') {
    select['twitter.screen_name'] = srcUser.screen_name;
  } else if (source === 'google') {
    select['google.email'] = srcUser.email;
  } else if (source === 'facebook') {
    // TODO: Let's see
  }

  this.collection.findOne(select, function(error, dbUser) {
    if (error) {
      callback(error);
    }

    callback(null, dbUser);
  });
};

module.exports.findOrCreate = function(source, user, promise) {
  var self = this;
  var user;
  if (arguments.length === 1) { // password-based
    // TODO: Implement password-based auth
  } else { // non-password-based
    
    self.findBySource(source, user, function(error, dbUser){
      if (error) {
        log.error('Unknown error: ' + error);
      }

      if(!dbUser) {
        log.trace('Could not find user!');

        // if no, add a new user with specified info
        self.createNew(user, source, promise);
      } else {
        // if yes, merge/update the info
        self.updateUserBySource(dbUser, source, user, promise);
      }
    });
  }
};

module.exports.createNew = function (user, source, promise) {
  if(!source) {
    // TODO: Assume it's email
  } else {
    var userObj = {
      id: "".randomString(),
    };

    if(source === 'twitter') {
      userObj['name'] = user.name;
    } else if(source === 'google') {
      userObj['email'] = user.email;
    }

    userObj[source] = user;

    this.collection.insert(userObj);
    promise.fulfill(userObj);
  }
};

module.exports.updateUserBySource = function (dbUser, source, srcUser, promise) {
  if(!source) {
    promise.fulfill(dbUser);
  } else {
    dbUser[source] = srcUser;

    this.collection.save(dbUser, {}, function(error) {
      if(error) {
        log.error(error);
      }
      promise.fulfill(dbUser);
    });
  }
};

