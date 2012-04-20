var url = require('url');
var http = require('http');
var https = require('https');

var db = require('../helpers/database').db;

module.exports  = function() {};

module.exports.save = function(imgUrl, fileName, callback) {
  var parsedUrl = url.parse(imgUrl, true);

  log.info(parsedUrl);
  if(!parsedUrl.host) {
    // Already saved on this website
    callback(null, imgUrl);
  } else {
    var protocol = (parsedUrl.protocol === 'http:' ? http : parsedUrl.protocol === 'https:' ? https : null);
    protocol.get(parsedUrl, function(res) {
      log.info('Response Header: ', res);
      db.gridfs().open(fileName, 'w', {
        'content_type': res.headers['content-type']
      }, function(error, gs) {
        res.on('data', function(chunk) {
          gs.write(chunk);
        });

        res.on('end', function() {
          gs.close(function(error) {
            if(error) {
              callback(error);
            }
            callback();
          });
        });
      });
    }).on('error', function(e) {
      log.error('Error downloading image.', e);
      callback(e);
    });
  }
};

module.exports.load = function(fileName, callback) {
  db.gridfs().open(fileName, 'r', function(error, reply) {
    
  });
};