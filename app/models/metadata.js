
var db = require('../helpers/database').db;

module.exports = {
  collection: db.collection('metadata')
};

module.exports.getDocument = function(callback) {
  var self = this;
  self.collection.findOne(function(error, doc) {
    if(error) {
      callback(error);
    }

    if(!doc) {
      var blankObj = {
        _id: 0
      };
      callback(null, blankObj);
    } else {
      callback(null, doc);
    }
  });
};

module.exports.getValue = function (key, callback) {
  var self = this;
  self.getDocument(function(error, doc) {
    if(error) {
      callback(error);
    }

    callback(null, doc[key]);
  });
};

module.exports.setValue = function (key, value) {
  var self = this;
  self.getDocument(function(error, doc) {
    if(error) {
      log.error(error);
    }

    doc[key] = value;
    
    self.save(doc);
  });
};
