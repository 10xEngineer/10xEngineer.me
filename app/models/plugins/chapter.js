module.exports = function(schema, options) {
  schema.pre('save', function (next) {
    this._wasNew = this.isNew;
    next();
  });

  schema.post('save', function() {
    var self = this;
    var id = parseInt(self.id.toString());
    var Course = mongoose.model('Course');

    // Add chapter to the course
    if (self._wasNew) {
      schema.collection.findOne({ id: id }, function(error, chapter) {
        if(error) {
          log.error(error);
        }

        Course.findById(chapter.course, function(error, course) {
          if(error) {
            log.error(error);
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
