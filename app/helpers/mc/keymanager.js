var http = require('http');
var url = require('url');

function KeyManager(endpoint) {
  this.endpoint = endpoint + '/keys';
}

/*
 * Create new keypair by given name
 * @name - name of keypair
 * @callback - function(error, keyobj)
 */
KeyManager.prototype.create = function(name, callback) {
  var options = url.parse(this.endpoint);
  options.method = 'POST';
  
  var req = http.request(options, function(res) {
    var resString = '';

    if(res.statusCode !== 200) {
      return callback(new Error('Error creating keypair.'));
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

      callback(null, resObject);
    });
  });

  var body = {
    name: name
  };
  req.end(JSON.stringify(body));
};

module.exports.KeyManager = KeyManager;