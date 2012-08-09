;!function(exports, undefined) {

  function VFSClient(bucketId) {
    this.bucket = bucketId;
    this.prefix = '/fs/' + this.bucket;
  };

  VFSClient.prototype.readDir = function(path, callback) {
    request.get(this.prefix + path)
      .end(function(res) {
      if(res.ok) {
        callback(res.body);
      }
    });
  };

  VFSClient.prototype.newFile = function(name, path, callback) {
    request.put(this.prefix + path + name)
      .end(callback);
  };

  VFSClient.prototype.newDir = function(name, path, callback) {
    request.put(this.prefix + path + name + '/')
      .end(callback);
  };

  VFSClient.prototype.rename = function(from, to, callback) {
    request.post(this.prefix + to)
      .set('Content-Type', 'application/json')
      .send('{"renameFrom":"' + from + '"}')
      .end(callback);
  };

  VFSClient.prototype.removeFile = function(path, callback) {
    request.del(this.prefix + path)
      .end(callback);
  };

  VFSClient.prototype.removeDir = function(path, callback) {
    request.del(this.prefix + path + '/')
      .end(callback);
  };

  if (typeof define === 'function' && define.amd) {
    define(function() {
      return VFSClient;
    });
  } else {
    exports.VFSClient = VFSClient; 
  }

}(typeof process !== 'undefined' && typeof process.title !== 'undefined' && typeof exports !== 'undefined' ? exports : window);
