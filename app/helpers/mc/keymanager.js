var request = require('request');
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
  var reqBody = {
    name: name
  };
  
  log.info('Requesting for a new key - ', reqBody.name);
  request.post({
    url: this.endpoint,
    json: reqBody
  }, function(error, res, body) {
    if(error) {
      return callback(error);
    }
    if(res.statusCode !== 201) {
      if(res.statusCode === 409) {
        return callback(new Error('Conflict with existing key.'));
      } else {
        log.error("Res:", res);
        return callback(new Error('Error creating keypair.'));        
      }
    }

    if(!body.name) {
      body.name = reqBody.name;
    }

    log.info("Received the key: ", body);
    callback(null, body);
  });
};

module.exports.KeyManager = KeyManager;