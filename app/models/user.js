var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Count = mongoose.model('Count');
var config = load.helper('config');

// Make _id a Numver once old schemas are migrated from version 1 to 2
var UserSchema = new Schema({
  _id: { type: ObjectId },
  id: { type: Number, unique: true, index: true },
  email: { type: String, index: true, trim: true },
  name: { type: String, trim: true },
  image: { type: String },
  courses: [{ type: ObjectId, ref: 'Course'}],
  roles: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now },
  google: {
    name: String,
    email: String,
    picture: String,
    link: String
  },
  facebook: {
    username: String,
    name: String,
    email: String,
    link: String
  },
  twitter: {
    name: String,
    screen_name: String,
    profile_image_url: String
  }
}, {
  collection: 'users'
});

// Set default id
UserSchema.pre('save', function(next) {
  var user = this;
  
  // Assign "default" role to new user
  if(!user.roles || user.roles.length == 0) {
    user.roles.push('default');
  }

  if(!user.id) {
    Count.getNext('user', function(error, id) {
      user.id = id;
      next();
    })
  } else {
    next();
  }
});

UserSchema.statics.findById = function(id, callback) {
  try {
    id = parseInt(id.toString());
  } catch(error) {
    log.warn('Database migration required');
  }

  this.findOne({ id: id }, callback);
};

UserSchema.statics.findOrCreate = function(source, userData, promise) {
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

        if(!dbUser.name && userData['name']) {
          dbUser.name = userData.name;
        }
        if(!dbUser.email && userData['email']) {
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
};


UserSchema.methods.updateUserRoles = function(roles, callback){
  log.info("ROLES :: ",roles);
  log.info("BEFORE :: ", this);
  this.roles = roles;
  log.info("AFTER :: ", this);
  this.save(function(error){
    if(error){
      log.error(error);
    }
  })
  callback();
}


mongoose.model('User', UserSchema);

var User = mongoose.model('User');


// Support functions

var createNew = function(source, userData, callback) {
  var newUser = new User();
  if(userData.name) {
    newUser.name = userData.name
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

  var select = {};

  if(source === 'twitter') {
    select['twitter.screen_name'] = userData.screen_name;
  } else if (source === 'google') {
    select['email'] = userData.email;
  } else if (source === 'facebook') {
    select['email'] = userData.email;
  }

  User.findOne(select, function(error, dbUser) {
    if (error) {
      callback(error);
    }

    callback(null, dbUser);
  });
};

