var mongoose = require('mongoose');

var Count = mongoose.model('Count');

module.exports.generateId = function(schema, options) {
  schema.add({ id: { type: Number, unique: true, index: true } });

  schema.pre('save', function (next) {
    var self = this;
    
    if(!self.id) {
      Count.getNext('chapter', function(error, id) {
        self.id = id;
        next();
      });
    } else {
      next();
    }
  });
};
