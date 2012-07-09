var Progress = load.model('Progress');
var User = load.model('User');

module.exports = function() {};


// Store Progress into Session
module.exports.get = function(userId, callback) {

	User.findOne({id: userId}, function(error,user){
		if(error) {
			log.error(error);
			callback(error);
		}
		Progress.find({user: user._id}, function(error, progress) {
			if(error) {
				log.error(error);
				callback(error);
			}
			var progressLength = progress.length;
			var progressJSON = {};
			for (var progressIndex = 0; progressIndex < progressLength; progressIndex++) {
				var key = progress[progressIndex].course;
				var value = progress[progressIndex];
				progressJSON[key] = value;
			};
			callback(null, progressJSON);
		});
	});
};

// Change the status of sessionProgress to start
module.exports.start = function(lesson, progress) {

	var courseId = lesson.chapter.course;
	var chapterId = lesson.chapter.id;
	var lessonId = lesson.id;

	var chapters = progress[courseId].chapters;

	var length = chapters.length;

	for (var index = 0; index < length; index++) {
		if(chapters[index].id == chapterId) {
			var lessons = chapters[index].lessons;
			var lessonsLength = lessons.length;
			for (var lessonindex = 0; lessonindex < lessonsLength; lessonindex++) {
				if(lessons[lessonindex].id == lessonId) {
					lessons[lessonindex].status = 'ongoing';
				}
			}
		}
	}
};

// Change the status of sessionProgress to completed
module.exports.completed = function(data, progress) {

	var courseId = data.chapter.course;
	var chapterId = data.chapter._id;
	var lessonId = data._id;

	var chapters = progress[courseId].chapters;
	var length = chapters.length;

	for (var index = 0; index < length; index++) {
		if(chapters[index].id == chapterId) {
			var lessons = chapters[index].lessons;
			var lessonsLength = lessons.length;
			for (var lessonindex = 0; lessonindex < lessonsLength; lessonindex++) {
				if(lessons[lessonindex].id == lessonId) {
					lessons[lessonindex].status = 'completed';
				}
			}
		}
	}
};

// Set the videoProgress of sessionProgress
module.exports.videoProgress = function(data, progress) {

	var courseId = data.chapter.course;
	var chapterId = data.chapter._id;
	var lessonId = data._id;

	var chapters = progress[courseId].chapters;
	var length = chapters.length;

	for (var index = 0; index < length; index++) {
		if(chapters[index].id == chapterId) {
			var lessons = chapters[index].lessons;
			var lessonsLength = lessons.length;
			for (var lessonindex = 0; lessonindex < lessonsLength; lessonindex++) {
				if(lessons[lessonindex].id == lessonId) {
					lessons[lessonindex].videoProgress = data.data;
				}
			}
		}
	}
};

// Persists current progress session in mongodb
module.exports.update = function(data, progressSession) {
	log.info('Update.');
	var courseId = data.courseId;
	var userId = data.userId;
	log.info(userId);
	
	Progress.findOne({user: userId, course: courseId}, function(error, progress) {
		if(error) {
			log.error(error);
		}

		progress.chapters = progressSession[courseId].chapters;
		
		progress.markModified('chapters');
		progress.save(function(error) {
			if(error) {
				log.error(error);
			}
		});
	});
};