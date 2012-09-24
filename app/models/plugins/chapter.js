var model = require('../index');

module.exports = function(schema, options) {
  schema.pre('save', function (next) {
    this._wasNew = this.isNew;
    next();
  });

  schema.post('save', function(callback) {
    var self = this;
    var id = parseInt(self.id.toString());
    var Course = model.Course;
    var Chapter = model.Chapter;

    // Add chapter to the course
    if (self._wasNew) {
      Chapter.findOne({ id: id }, function(error, chapter) {
        if(error) return callback(error);

        Course.findById(chapter.course, function(error, course) {
          if(error) return callback(error);

          if(!course.chapters) {
            course.chapters = [];
          }
          
          course.chapters.push(chapter._id);
          course.save(callback);
        });
      });
    }
  });
};
