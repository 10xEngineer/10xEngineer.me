
var model = require('./index');

var statics = {
  getValue: function(key, callback) {
    getDocument(function(error, doc) {
      if(error) {
        callback(error);
      }

      callback(null, doc[key]);
    });
  },

  setValue: function(key, value, callback) {
    getDocument(function(error, doc) {
      if(error) {
        log.error(error);
      }

      doc[key] = value;
      doc.markModified(key);
      
      doc.save(callback);
    });
  }
};

var getDocument = function(callback) {
  var Metadata = model.Metadata;
  Metadata.findOne(function(error, doc) {
    if(error) {
      callback(error);
    }

    if(!doc) {
      doc = new Metadata();
      doc.save(function(error){
        callback(null, doc);
      });
    } else {
      callback(null, doc);
    }
  });
};


module.exports = {
  name: 'Metadata',
  schema: require('./schema/metadata'),
  options: {
    statics: statics  
  }
};
