var db = require('../helpers/database').db;
var config = require('../helpers/config');

module.exports = db.collection('users');

module.exports.count = require('./count');

module.exports.findById = function(id, callback) {

  this.findOne({id: id}, function(error, dbUser) {
    if (error) {
      return callback(error);
    }

    //log.info('findById called');
    callback(null, dbUser);
  });
};


module.exports.findByEmail = function(email, callback) {

  this.findOne({email: email}, function(error, dbUser) {
    if (error) {
      return callback(error);
    }

    callback(null, dbUser);
  });
};

module.exports.findBySource = function(source, srcUser, callback) {

  var select = {};

  if(source === 'twitter') {
    select['twitter.screen_name'] = srcUser.screen_name;
  } else if (source === 'google') {
    select['email'] = srcUser.email;
  } else if (source === 'facebook') {
    select['email'] = srcUser.email;
  }

  this.findOne(select, function(error, dbUser) {
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
        self.createNewPromise(user, source, promise);
      } else {
        // if yes, merge/update the info
        self.updateUserBySource(dbUser, source, user, promise);
      }
    });
  }
};

module.exports.createNewPromise = function (user, source, promise) {
  this.createNew(user, source, function(error, dbUser) {
    if(error) {
      promise.fail(error);
    }
    
    promise.fulfill(dbUser);
  });
};

module.exports.createNew = function (user, source, callback) {
  var self = this;
  if(!source) {
    // TODO: Assume it's email
  } else {
    self.count.getNext('user', function(error, id) {
      if(error) {
        callback(error);
      }

      var now = new Date();
      var userObj = {
        _id: id,
        id: id,
        created_at: now.getTime(),
        modified_at: now.getTime()
      };

      if(source === 'twitter') {
        userObj['name'] = user.name;
      } else if(source === 'google') {
        userObj['name'] = user.name;
        userObj['email'] = user.email;
      } else if(source === 'facebook') {
        userObj['name'] = user.name;
        userObj['email'] = user.email;
      } else if(source === 'email') {
        userObj['email'] = user.email;
      }
	
	  // check against the default site admin list from console
	  if( config.admin[source] == user.name || config.admin[source] == user.email ) {
	    log.info('New user is an admin: ', config.admin[source]);
		userObj['role'] = 'admin';
	  } 
      userObj[source] = user;

      self.insert(userObj);
      callback(null, userObj);
    });
  }
};

module.exports.updateUserBySource = function (dbUser, source, srcUser, promise) {
  if(!source) {
    promise.fulfill(dbUser);
  } else {
    var now = new Date();
    dbUser[source] = srcUser;
    dbUser['modified_at'] = now.getTime();

    if(!dbUser['name'] && srcUser['name']) {
      dbUser['name'] = srcUser.name;
    }
    if(!dbUser.email && srcUser['email']) {
      dbUser['email'] = srcUser.email;
    }

    this.save(dbUser, {}, function(error) {
      if(error) {
        log.error(error);
      }
      promise.fulfill(dbUser);
    });
  }
};

module.exports.findOrCreateRegisteredCourse = function(user, course_id) {		
	if(!user.registered_courses)
		user.registered_courses = {};
	
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
