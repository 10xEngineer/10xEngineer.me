var model = require('../index');

module.exports = function(name) {
  return function(schema, options) {
    schema.add({ id: { type: Number, unique: true, index: true } });

    schema.pre('save', function (next) {
      var Count = model.Count;
      
      var self = this;
      
      if(!self.id) {
        Count.getNext(name, function(error, id) {
          self.id = id;
          next();
        });
      } else {
        next();
      }
    });
  };
};
