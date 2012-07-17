
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var model = require('./index');
var MetadataSchema = require('./schema/metadata');

var statics = {
  getValue: function(key, callback) {
    getDocument(function(error, doc) {
      if(error) {
        callback(error);
      }

      callback(null, doc[key]);
    });
  },

  setValue: function(key, value) {
    getDocument(function(error, doc) {
      if(error) {
        log.error(error);
      }

      doc[key] = value;
      doc.markModified(key);
      
      doc.save();
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


model.init('Metadata', MetadataSchema, {
  statics: statics
});
