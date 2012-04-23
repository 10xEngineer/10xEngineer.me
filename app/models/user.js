var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Count = mongoose.model('Count');
var config = load.helper('config');

// Make _id a Numver once old schemas are migrated from version 1 to 2
var UserSchema = new Schema({
  _id: { type: {}, index: true },
  email: { type: String, index: true, trim: true },
  name: { type: String, trim: true },
  image: { type: String },
  courses: [{ type: Number, ref: 'Course'}],
  abilities: {},
  created_at: { type: Date, default: Date.now },
  modified_at: { type: Date, default: Date.now },
  google: {
    name: String,
    email: String,
    picture: String
  },
  facebook: {
    username: String,
    name: String,
    email: String
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
  if(!user._id) {
    Count.getNext('user', function(error, id) {
      user._id = id;
      next();
    })
  } else {
    next();
  }
});

// TODO: Temporary override until _id type is set to Number
UserSchema.statics.findById = function(id, callback) {
  try {
    id = parseInt(id);
  } catch(error) {
    log.warn('Database migration required');
  }

  this.findOne({ _id: id }, callback);
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

  // check against the default site admin list from console
  if(config.admin[source] == userData.email) {
    log.info('New user is an admin: ', config.admin[source]);

    //going to be deprecated
    newUser['role'] = 'admin';
    newUser.abilities.role = 'admin';
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


// TODO: Migrate later

module.exports.findOrCreateRegisteredCourse = function(user, course_id) {		
	//initialize the registered course.
	if(!user.registered_courses)
		user.registered_courses = {};
	
	//if the course hasn't been taken before, put it into the registered course under user.
	if(!user.registered_courses[course_id]){
		var setValue = {};
		setValue["registered_courses."+course_id] = {};
    	this.update({id:user.id},{"$set":setValue});
	} 
	
	return user.registered_courses[course_id];		
}

module.exports.findOrCreateLesson = function(user, course_id, chapter_id, lesson_id){
	var course = this.findOrCreateRegisteredCourse(user, course_id);
	var query = {};
	query["registered_courses."+course_id+".chapters."+chapter_id+".lessons."+lesson_id] = {"$exists": true};
	
	var lesson_status;
	//check if the lesson has been taken
	try{
		lesson_status = user.registered_courses[course_id].chapters[chapter_id].lessons[lesson_id];
	}catch(e){
		
	}
	
	if (!lesson_status)
	{
		var setValue = {};
		setValue["registered_courses."+course_id+".chapters."+chapter_id+".lessons."+lesson_id] = 
		{
			status:"In Progress"
		};
		console.log(setValue);
		this.update({id:user.id}, {"$set": setValue});
		return {status:"In Progress"};
	}
	return lesson_status;
}

module.exports.updateLessonProgress = function(user_id, course_id, chapter_id, lesson_id, status){
	var setValue = {};
	setValue["registered_courses."+course_id+".chapters."+chapter_id+".lessons"+lesson_id] = 
	{
		status: status
	}
	this.update({id:user_id}, {"$set":setValue});
}
