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

  VFSClient.prototype.readFile = function(path, callback) {
    request.get(this.prefix + path)
      .end(function(res) {
      if(res.ok) {
        var body = res.body || res.text;
        callback(body);
      }
    });
  };

  VFSClient.prototype.newFile = function(name, path, callback) {
    path = fixPath(path);
    request.put(this.prefix + path + name)
      .end(callback);
  };

  VFSClient.prototype.saveFile = function(path, content, callback) {
    request.put(this.prefix + path)
      .type('text/plain')
      .send(content)
      .end(callback);
  };

  VFSClient.prototype.newDir = function(name, path, callback) {
    path = fixPath(path);
    request.put(this.prefix + path + name + '/')
      .end(callback);
  };

  VFSClient.prototype.rename = function(to, from, callback) {
    request.post(this.prefix + to)
      .type('application/json')
      .send('{"renameFrom": "' + from + '"}')
      .end(callback);
  };

  VFSClient.prototype.removeFile = function(path, callback) {
    console.log(this);
    request.del(this.prefix + path)
      .end(callback);
  };

  VFSClient.prototype.removeDir = function(path, callback) {
    path = fixPath(path);
    request.del(this.prefix + path)
      .end(callback);
  };

  if (typeof define === 'function' && define.amd) {
    define(function() {
      return VFSClient;
    });
  } else {
    exports.VFSClient = VFSClient; 
  }

  function fixPath(path) {
    if(path.charAt(path.length-1) != '/') {
      return path + '/';
    } else {
      return path;
    }
  }

}(typeof process !== 'undefined' && typeof process.title !== 'undefined' && typeof exports !== 'undefined' ? exports : window);
