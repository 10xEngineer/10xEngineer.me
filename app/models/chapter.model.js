var async = require('async');

var model = require('./index');


var methods = {
  publish: function(publish, callback) {
    var Chapter = model.Chapter;
    var chapter = this;
    if(publish) {
      Chapter.findById(chapter._id)
      .populate('lessons')
      .exec(function(error, chapter) {
        if(error) return callback(error);

        var lessonsLength = chapter.lessons.length;
        async.forEach(chapter.lessons, function(lessonInst, innerCallback) {
            lessonInst.status = "published";
            lessonInst.save(innerCallback);
        }, function(error){
          if(error) return callback(error);

          chapter.status = 'published';
          chapter.markModified('lessons');

          chapter.save(callback);
        });
      });

    } else {
      chapter.status = 'draft';
      chapter.save(callback);
    } 
  },

  removeChapter: function(callback) {
    var Chapter = model.Chapter;
    var Course = model.Course;

    // TODO: Remove all child 
    Chapter.findById(this._id)
      .populate('lessons')
      .exec(function(error, chapter){
      if(error) return callback(error);

      // For Remove Chapter _Id from Course Table
      Course.findById(chapter.course, function(error, course){
        if(error) return callback(error);

        course.chapters.splice(course.chapters.indexOf(chapter._id),1);
        course.markModified('chapters');
        course.save(function(error){
          if(error) return callback(error);

          if(chapter.lessons.length>0){     
            chapter.lessons[0].removeAllLessonsFromThisChapter(function(error){
              if(error) return callback(error);
    
              return chapter.remove(callback);
            });      
          } else {
            chapter.remove(callback);
          }
        });
      });
    });
  },

  removeAllChapterFromThisCourse: function(callback) {
    var Chapter = model.Chapter;
    var refChapter = this;

    Chapter.find({course:refChapter.course})
      .populate('lessons')
      .exec(function(error, chapters){
      if(error) return callback(error);
        
      if(chapters.length>0){
        async.forEach(chapters, function(chapter, forEachCallback){
          chapter.removeChapter(forEachCallback);
        }, function(error){
          if(error) return callback(error);
          Chapter.remove({course:refChapter.course}, callback);
        });
      } else {
        callback();
      }
    });
  },

  // For Move Up & Down Chapter
  move: function(index, callback){

    var chapter = this ;
    var temp;
    var course = chapter.course;
    for (var i = 0 ; i < course.chapters.length; i++) {
      if(course.chapters[i].toString() == chapter._id.toString()) {
        if(index === 0) {
          if(i-1 >= 0) {
              temp = course.chapters[i];
              course.chapters[i] = course.chapters[i-1];
              course.chapters[i-1] = temp;
              break;
            }
        }  
        else if(index == 1) {
        
          if(i+1 <= course.chapters.length) {
              temp = course.chapters[i];
              course.chapters[i] = course.chapters[i+1];
              course.chapters[i+1] = temp;
          break;
            }
        }      
      }
    }
    course.markModified('chapters');
    course.save(callback);
  }
};

module.exports = {
  name: 'Chapter',
  schema: require('./schema/chapter'),
  options: {
    methods: methods,
    plugins: ['id', 'timestamp', 'chapter']    
  }
};

