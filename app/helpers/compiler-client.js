var http = require('http');
var url = require('url');

function Compiler(endpoint) {
  this.endpoint = endpoint + '/sandboxes';
}

/*
 * Setup a new compiler sandbox
 * @options
 *   kitName - name of the compiler kit
 *   asset - assetId of source code
 *   keypair - The keypair name
 * @callback - function(error, lab)
 */
Compiler.prototype.create = function(options, callback) {
  var self = this;
  var reqOptions = url.parse(this.endpoint);
  reqOptions.method = 'POST';
  
  var req = http.request(reqOptions, function(res) {
    var resString = '';

    if(res.statusCode !== 201) {
      return callback(new Error('Error creating compiler sandbox.'));
    }

    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      resString += chunk;
    });

    res.on('end', function() {
      var resObject;
      try {
        resObject = JSON.parse(resString);
      } catch(e) {
        return callback(e);
      }

      console.log("Sandbox Created: ", resObject);
      callback(null, new Sandbox(self.endpoint, resObject));
    });
  });

  var body = {
    comp_kit: options.kitName,
    source_url: 'https://dl.dropbox.com/s/amnsvwxag7prl48/Sample.tar.gz?dl=1',
    //source_url: options.asset,
  };
  req.end(JSON.stringify(body));
};

module.exports.Compiler = Compiler;

function Sandbox(endpoint, id) {
  this.endpoint = endpoint + '/' + id;
  this.id = id;
}

Sandbox.prototype.compile = function(args, callback) {
  this.sendRequest('compile', args, callback);
};

Sandbox.prototype.run = function(args, callback) {
  this.sendRequest('run', args, callback);
};

Sandbox.prototype.sendRequest = function(action, args, callback) {
  var self = this;
  var reqOptions = url.parse(this.endpoint);
  reqOptions.method = 'POST';
  
  var req = http.request(reqOptions, function(res) {
    var resString = '';

    if(res.statusCode !== 200) {
      return callback(new Error('Error executing sandbox action.'));
    }

    res.setEncoding('utf8');
    callback(null, res);
  });

  var body = {
    cmd: action,
    args: args
  };
  req.end(JSON.stringify(body));
};

Sandbox.prototype.delete = function() {
  var self = this;
  var reqOptions = url.parse(this.endpoint);
  reqOptions.method = 'DELETE';
  
  var req = http.request(reqOptions, function(res) {
    if(res.statusCode !== 200) {
      return callback(new Error('Error executing sandbox action.'));
    }

    callback();
  });

  req.end();
};


