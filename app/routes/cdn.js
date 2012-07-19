
var cdn = require('../helpers/cdn');

module.exports = function() {};

module.exports.head = function(req, res) {
  var fileName = req.params.fileName;

  cdn.head(fileName, function(error, contentType, length) {
    if(error) {
      log.error(error);
      res.statusCode = 404;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.header('Accept-Ranges', 'bytes');
    res.header('Content-Type', contentType);
    res.header('Content-Length', length);

    res.end();
  });
};


module.exports.load = function(req, res) {
  var fileName = req.params.fileName;

  var reqRange = req.header('Range');
  var seekLength = 0;
  var readBytes = -1;

  if(!reqRange) {
    res.statusCode = 200;
  } else {
    var regex = new RegExp('^bytes=([\\d]+)-([\\d]*)$');

    var parsedRange = regex.exec(reqRange);
    res.statusCode = 206;
    seekLength = parseInt(parsedRange[1], 10);
    if(parsedRange[2]) {
      readBytes = parseInt(parsedRange[2], 10);
      if(readBytes <= seekLength){
        log.error("Invalid Range");
        res.statusCode = 416;
        return res.end();
      }
    }
  }

  cdn.load(fileName, seekLength, function(error, data, contentType, length) {
    if(error) {
      log.error(error);
      if(error=="Invalid Range"){
        res.statusCode = 416;
      } else {
        res.statusCode = 404;
      }
      res.end();
      return;
    }

    var contentLength = length - seekLength;
    var contentRange = 'bytes ' + seekLength + '-' + (length - 1) + '/' + length;
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Range', contentRange);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', contentLength);

    res.write(data);
    res.end();
  });
};
