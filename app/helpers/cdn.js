var url = require('url');
var http = require('http');
var https = require('https');

var fs = require('fs');
var mongoose = require('mongoose');

module.exports  = function() {};

// Save file
module.exports.save = function(imgUrl, fileName, callback) {
  var db = mongoose.connection.db;
  var GridStore = mongoose.mongo.GridStore;

  var parsedUrl = url.parse(imgUrl, true);

  if(!parsedUrl.host) {
    // Already saved on this website
    callback(null, imgUrl);
  } else {
    var protocol = (parsedUrl.protocol === 'http:' ? http : parsedUrl.protocol === 'https:' ? https : null);
    protocol.get(parsedUrl, function(res) {
      var data = '';

      res.setEncoding('binary');
      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {
        var gs = new GridStore(db, fileName, 'w', {
          'content_type': res.headers['content-type']
        });

        gs.open(function(error, gs) {
          if (error) {
            log.error(error);
            callback(error);
          }

          gs.write(data, function(error) {
            if(error) {
              log.erorr(error);
              callback(error);
            }
          });

          gs.close(function(error) {
            if(error) {
              callback(error);
            }
            callback(null, '/cdn/' + fileName);
          });
        });

      });

    }).on('error', function(e) {
      log.error('Error downloading image.', e);
      callback(e);
    });
  }
};

module.exports.saveFile = function(path, callback) {

};

// Load file
module.exports.load = function(fileName, callback) {
  var db = mongoose.connection.db;
  var GridStore = mongoose.mongo.GridStore;

  var gs = new GridStore(db, fileName, 'r');

  gs.open(function(error, gs) {
    if (error) {
      log.error(error);
      callback(error);
    }

    var contentType = gs.contentType;
    var contentLength = gs.length;
    gs.read(function(error, data) {
      callback(null, data, contentType, contentLength);
    });
  });
};



