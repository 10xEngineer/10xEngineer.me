var model = require('../index');

module.exports = function(name) {
  return function(schema, options) {
    schema.pre('save', function (next) {
      this._wasNew = this.isNew;
      next();
    });

    schema.post('save', function() {
      var Chapter = model.Chapter;
      var lesson = this;
      var id = parseInt(lesson.id.toString());

      // Add lesson to the chapter
      if (lesson._wasNew) {
        lesson.collection.findOne({ id: id }, function(error, lesson) {
          if(error) {
            log.error(error);
          }

          Chapter.findById(lesson.chapter, function(error, chapter) {
            if(error) {
              log.error(error);
            }

            chapter.lessons.push(lesson._id);

            chapter.save(function(error) {
              if(error) {
                log.error(error);
              }
            });
          });
        });
      }
    });
  };
};
