var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Count = mongoose.model('Count');

var User = new Schema({
  _id: { type: Number, index: true, required: true },
  email: { type: String, index: true, trim: true, required: true },
  name: {
    first: { type: String, trim: true },
    middle: { type: String, trim: true },
    last: { type: String, trim: true }
  },
  image: { type: String },
  courses: [{ type: Number, ref: 'Course'}],
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
});

// Set default id
User.pre('save', function(next) {
  var user = this;
  if(!user._id) {
    Count.getNext('user', function(error, id) {
      user._id = id;
      next();
    })
  }
});


mongoose.model('User', User);


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
