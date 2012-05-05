var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var MetadataSchema = new Schema({
  _id: { type: Number, default: 0 },
  schemaVersion: { type: Number, default: 1 }
}, {
  collection: 'metadata'
});

MetadataSchema.statics.getValue = function(key, callback) {
  getDocument(function(error, doc) {
    if(error) {
      callback(error);
    }

    callback(null, doc[key]);
  });
};

MetadataSchema.statics.setValue = function(key, value) {
  getDocument(function(error, doc) {
    if(error) {
      log.error(error);
    }

    doc[key] = value;
    doc.markModified(key);
    
    doc.save();
  });
};

mongoose.model('Metadata', MetadataSchema);

var Metadata = mongoose.model('Metadata');

var getDocument = function(callback) {
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
