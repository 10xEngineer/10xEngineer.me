var http = require('http');
var url = require('url');

var async = require('async');

function LabManager(endpoint) {
  this.endpoint = endpoint + '/labs';
}

/*
 * Setup a new lab
 * @options
 *   name - name of the lab (has to be unique)
 *   definition - Git repository URL of lab definition (public)
 *   keypair - The keypair name
 * @callback - function(error, lab)
 */
LabManager.prototype.create = function(options, callback) {
  var self = this;
  var reqOptions = url.parse(this.endpoint);
  reqOptions.method = 'POST';
  
  var req = http.request(reqOptions, function(res) {
    var resString = '';

    if(res.statusCode !== 200) {
      return callback(new Error('Error creating lab.'));
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

      callback(null, new Lab(self.endpoint, resObject.name));
    });
  });

  var body = {
    name: options.name,
    repo: options.definition,
    pools: {
      'pool-name': 'eng_pool_1', // TODO: Hardcoded.
    },
    attr: {
      'default-key': options.keypair
    }
  };
  req.end(JSON.stringify(body));
};

module.exports.LabManager = LabManager;

/*
 * Lab instance
 */
function Lab(endpoint, name) {
  var self = this;
  this.origEndpoint = endpoint;
  this.endpoint = endpoint + '/' + name;

  http.get(this.endpoint, function(res) {
    var resString = '';

    if(res.statusCode !== 200) {
      throw new Error('Error getting lab info.');
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
        throw e;
      }

      self.name = resObject.name;
      self.version = resObject.current_definition.version;
      self.repo = resObject.repo;
      self.token = resObject.token;
      self.state = resObject.state;
      self.meta = resObject.meta;
    });
  }).on('error', function(e) {
    console.log('Error getting lab info.');
  });
}

Lab.prototype.refreshVm = function(uuid, callback) {
  var self = this;

  http.get(this.origEndpoint + '/vms/' + uuid, function(res) {
    var resString = '';

    if(res.statusCode !== 200) {
      throw new Error('Error getting lab info.');
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
        throw e;
      }

      self.vms[uuid] = resObject;
      callback();
    });
  }).on('error', function(e) {
    console.log('Error getting lab info.');
    callback(e);
  });
};

Lab.prototype.refresh = function(callback) {
  var self = this;
  // TODO: Refresh lab state

  // Fetch vms
  http.get(this.endpoint + '/vms', function(res) {
    var resString = '';

    if(res.statusCode !== 200) {
      throw new Error('Error getting lab info.');
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
        throw e;
      }

      self.vms = {};
      async.forEach(resObject, function(vm, callback) {
        self.refreshVm(vm.uuid, callback);
      }, function(error) {
        callback(error);
      });
    });
  }).on('error', function(e) {
    console.log('Error getting lab info.');
  });
};

Lab.prototype.release = function(callback) {
  var self = this;
  var reqOptions = url.parse(this.endpoint + '/versions/' + this.version + '/release');
  reqOptions.method = 'POST';
  
  var req = http.request(reqOptions, function(res) {
    if(res.statusCode !== 202) {
      return callback(new Error('Error releasing definition.'));
    }

    res.on('end', function() {
      self.refresh(function(error) {
        callback(error);
      });
    });
  });

  req.end();
};

module.exports.Lab = Lab;
