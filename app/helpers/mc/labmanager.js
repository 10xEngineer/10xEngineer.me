var request = require('request');
var url = require('url');
var EventEmitter = require('events').EventEmitter;

var async = require('async');

function LabManager(endpoint) {
  this.origEndpoint = endpoint;
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
  var reqBody = {
    name: options.name,
    repo: options.definition,
    pools: {
      'compute': 'eng_pool_1', // TODO: Hardcoded.
    },
    attr: {
      'default-key': options.keypair
    }
  };

  log.info("Creating the lab: ", reqBody);
  request.post({
    url: this.endpoint,
    json: reqBody
  }, function(error, res, body) {
    if(error) {
      return callback(error);
    }
    if(res.statusCode !== 201) {
      log.error("Res:", res);
      return callback(new Error('Error creating lab.'));
    }

    // TODO: Add name
    if(!body.name) {
      body.name = reqBody.name;
    }
    
    var lab;
    try {
      lab = new Lab(self.origEndpoint, body.name, options.version);
    } catch(e) {
      return callback(e);
    }

    log.info('Lab Created - ', body.name);
    callback(null, lab);
  });
};

module.exports.LabManager = LabManager;

/*
 * Lab instance
 */
function Lab(endpoint, name, version) {
  var self = this;
  this.name = name;
  this.origEndpoint = endpoint;
  this.endpoint = endpoint + '/labs/' + name;
  this.version = version || '0.0.1';
}

Lab.prototype = new EventEmitter();

Lab.prototype.refresh = function(callback) {
  var self = this;

  log.info("Fetching lab metadata for " + self.name);
  log.info("URL: " + self.endpoint);
  request.get({
    url: this.endpoint
  }, function(error, res, body) {
    if(error) {
      throw error;
    }
    if(res.statusCode !== 200) {
      log.error('Res', res);
      throw new Error('Error getting lab info.');
    }

    if(typeof(body) === 'string') {
      body = JSON.parse(body);
    }

    log.info("Lab metadata received.");
    self.name = body.name;
    self.repo = body.repo;
    self.token = body.token;
    self.state = body.state;
    self.meta = body.meta;

    log.info('State: ', self.state);
    if(self.state == 'created' && self.localState != 'released') {
      self.release(function(error) {
        if(error) return callback(error);
        self.localState = 'released';
        self.refresh(callback);
      });
    } else if(self.state == 'pending' || self.localState == 'released') {
      self.getVmList(callback);
    } else {
      setTimeout(function() {
        self.refresh(callback);
      }, 1000);
    }
  });
};

Lab.prototype.getVmList = function(callback) {
  var self = this;

  log.info("Getting a list of available vms...");
  request.get({
    url: this.endpoint + '/vms'
  }, function(error, res, body) {
    if(error) {
      return callback(error);
    }
    if(res.statusCode !== 200) {
      return callback(new Error('Error getting lab info.'));
    }

    var respArray;
    try {
      respArray = JSON.parse(body);
    } catch(e) {
      return callback(new Error("Error parsing list"));
    }

    log.info(respArray.length + ' vm received.');
    self.vms = {};
    async.forEach(respArray, function(vm, callback) {
      self.refreshVm(vm.uuid, callback);
    }, function(error) {
      callback(error);
    });
  });
};

Lab.prototype.refreshVm = function(uuid, callback) {
  var self = this;

  log.info("Refreshing vm - ", uuid);
  request.get({
    url: this.origEndpoint + '/vms/' + uuid
  }, function(error, res, body) {
    if(error) {
      return callback(error);
    }
    if(res.statusCode !== 200) {
      log.info("Res", res);
      return callback(new Error('Error getting lab info.'));
    }

    log.info("Refreshed - ", uuid);

    if(typeof(body) == 'string') {
      try {
        body = JSON.parse(body);
      } catch(e) {
        return callback(new Error("Error parsing vm"));
      }      
    }

    self.vms[uuid] = body;

    // TODO: hardcode single vm for now
    self.currentVm = body;
    callback();
  });
};

Lab.prototype.getVersions = function(callback) {
  var self = this;

  // Get valid versions
  request.get({
    url: this.endpoint + '/versions'
  }, function(error, res, body) {
    if(error) {
      return callback(error);
    }
    if(res.statusCode !== 200) {
      log.info("Res", res);
      return callback(new Error('Error releasing definition.'));
    }

    if(typeof(body) == 'string') {
      try {
        body = JSON.parse(body);
      } catch(e) {
        return callback(new Error("Error parsing vm"));
      }      
    }

    if(body.length === 0) {
      self.getVersions(callback);
    } else {
      log.info('Got existing versions for lab.', body[0].version);
      callback(null, body[0].version);
    }
  });
};

Lab.prototype.release = function(callback) {
  var self = this;
  
  self.getVersions(function(error, version) {

    log.info('Releasing the lab ' + this.name + ' with version ' + version);
    request.post({
      url: self.endpoint + '/versions/' + version + '/release'
    }, function(error, res, body) {
      if(error) {
        log.error(error);
        return callback(error);
      }
      if(res.statusCode !== 202) {
        log.info("Res", res);
        return callback(new Error('Error releasing definition.'));
      }

      log.info('Lab successfully released.');
      self.refresh(function(error) {
        callback(error);
      });
    });
  });

};

Lab.prototype.getVm = function(uuid) {
  // TODO: Return current vm for now
  return this.currentVm;
};

Lab.prototype.createTTYSession = function(vm, key, callback) {
  var reqBody = {
    lab: vm.lab.name,
    user: 'ubuntu', // TODO: Hardcoded
    vm_name: vm.vm_name,
    private_key: key.identity
  };

  log.info('Creating a tty session.');
  log.info('Body: ', reqBody);
  request.post({
    url: 'http://' + vm.term_server.host + ':' + vm.term_server.manage_port + '/sessions',
    json: reqBody
  }, function(error, res, body) {
    if(error) {
      return callback(error);
    }
    console.log(res.statusCode);
    if(res.statusCode !== 200) {
      log.info("Res", res);
      return callback(new Error('Error creating tty session.'));
    }

    log.info('TTY session created.', body);
    callback(null, body);
  });
};

module.exports.Lab = Lab;
