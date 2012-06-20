var Course = load.model('Course');
var Chapter = load.model('Chapter');
var Lesson = load.model('Lesson');


module.exports = function() {};

module.exports.course = function(data, callback) {
  var course = new Course();
  course.title = data.title;
  course.desc = data.desc;
  course.image = data.image;

  course.save(function(error) {
    if(error) {
      log.error(error);
      callback(error);
    }

    Course.findOne({ id: course.id }, function(error, dbCourse) {
      if(error) {
        log.error(error);
        callback(error);
      }

      callback(null, dbCourse);
    });
  });
};

module.exports.chapter = function(data, courseId, callback) {
  var chapter = new Chapter();
  chapter.title = data.title;
  chapter.desc = data.desc;
  chapter.course = courseId;

  chapter.save(function(error) {
    if(error) {
      log.error(error);
      callback(error);
    }

    Chapter.findOne({ id: chapter.id }, function(error, dbChapter) {
      if(error) {
        log.error(error);
        callback(error);
      }

      callback(null, dbChapter, data.lessons);
    });
  });
};

module.exports.lesson = function(data, chapterId, callback) {
  var lesson = new Lesson();
  lesson.title = data.title;
  lesson.desc = data.desc;
  lesson.chapter = chapterId;
  lesson.type = data.type;

  if(data.type === 'video') {
    lesson.video.content = data.video;
    lesson.video.type = data.videoType;
  } else {
    // Not supported for now
  }

  lesson.save(function(error) {
    if(error) {
      log.error(error);
      callback(error);
    }
  });
};