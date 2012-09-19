var model = require('../index');

module.exports = function(schema, options) {
  schema.pre('save', function (next) {
    this._wasNew = this.isNew;
    next();
  });

  schema.post('save', function() {
    var self = this;
    var id = parseInt(self.id.toString());
    var Course = model.Course;
    var Chapter = model.Chapter;

    // Add chapter to the course
    if (self._wasNew) {
      Chapter.findOne({ id: id }, function(error, chapter) {
        if(error) {
          log.error(error);
        }

        Course.findById(chapter.course, function(error, course) {
          if(error) {
            log.error(error);
          }

          if(!course.chapters) {
            course.chapters = [];
          }
          
          course.chapters.push(chapter._id);

          course.save(function(error) {
            if(error) {
              log.error(error);
            }
          });
        });
      });
    }
  });
};
