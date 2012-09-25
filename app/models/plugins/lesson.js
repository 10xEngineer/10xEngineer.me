var model = require('../index');

module.exports = function(schema, options) {
  schema.pre('save', function (callback) {
    this._wasNew = this.isNew;
    callback();
  });

  schema.post('save', function(callback) {
    var Chapter = model.Chapter;
    var lesson = this;
    var id = parseInt(lesson.id.toString());

    // Add lesson to the chapter
    if (lesson._wasNew) {
      lesson.collection.findOne({ id: id }, function(error, lesson) {
        if(error) return callback(error);

        Chapter.findById(lesson.chapter, function(error, chapter) {
          if(error) return callback(error);

          if(!chapter.lessons) {
            chapter.lessons = [];
          }
          
          chapter.lessons.push(lesson._id);

          chapter.save(callback);
        });
      });
    }
  });
};
