var mcClient = require('../app/helpers/microcloud-client');

module.exports = function(io) {

  /*
  *  Labs: Responsible for managing labs
  *  Events:
  *    lab_init - Emitted by client to initialize a lab. Accepts labId.
  *    status - Emitted upon change of status of an entity (course/chapter/lesson status not-started/ongoing/completed)
  *    persist - Persists current user session in mongodb upon emitted. It is emitted periodically/before session expiry
  */
  io
    .of('/labs')
    .on('connection', function (socket) {
      
    socket.on('lab_init', function(id){
      // Get keypair if already exists or create new
      getOrGenerateKeyPair(lessonId, id, function(error, key) {
        socket.emit('lab_ready', {});
      });
    });

    socket.on('disconnect', function() {
      console.log('Lab connection closed. Should teardown any available lab.')
    });
  });
};

// TODO: Get key from progress->lesson. Maybe write a util lib to navigate progress?
function getOrGenerateKeyPair(lessonId, name, callback) {
  Progress.findById(name, function(error, progress) {
    if(!progress.sysAdmin || !progress.sysAdmin.key) {
      // Create a new pair
      mcClient.keyManager.create(name, function(error, key) {
        if(!progress.sysAdmin) {
          progress.sysAdmin = {};
        }
        progress.sysAdmin.key = key;
        progress.markModified('sysAdmin')
      });
    } else {
      callback(null, progress.sysAdmin.key);
    }
  });
}