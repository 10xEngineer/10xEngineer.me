var adapter = require('mongo-vfs-http-adapter');
var mongofs = require('mongo-vfs');

module.exports = function(app) {
  // TODO: Load rest of the database config (host, port etc.)
  mongofs({
    database: 'mongofs_test'
  }, function(error, vfs) {
    app.all('/fs/:bucketId/*', function(req, res, next) {
    	var bucketId = req.params.bucketId;
    	adapter('/fs/' + bucketId + '/', vfs)(req, res, next);
    });
  });
};
