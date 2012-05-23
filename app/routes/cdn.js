var cdn = load.helper('cdn');

module.exports = function() {};

module.exports.load = function(req, res) {
  var fileName = req.params.fileName;

  cdn.load(fileName, function(error, data, contentType, length) {
    if(error) {
      log.error(error);
      res.statusCode = 404;
      res.end();
      return;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', length);

    res.write(data);
    res.end();
  });
};
