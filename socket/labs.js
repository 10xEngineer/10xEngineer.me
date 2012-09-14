var model = require('../app/models');
var mcClient = require('../app/helpers/microcloud-client')("http://localhost:8000");
var Lab = mcClient.Lab;

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
    var labInit = false;
      
    socket.on('lab_init', function(lessonId, progressId){
      // TODO: Hardcoded for testing
      //return socket.emit('lab_ready', {});

      // Get keypair if already exists or create new
      getOrGenerateKeyPair(lessonId, progressId, function(error, key) {
        if(error) {
          log.error("Error: ", error);
          return socket.emit('error', 'Error while creating a key');
        }

        createOrResumeLab(lessonId, progressId, key, function(error, lab) {
          if(error) {
            log.error("Error: ", error);
            return socket.emit('error', 'Error creating/resuming lab.');
          }
          labInit = true;
          var uuid = 'hardcoded'; //TODO: hardcoded uuid
          var vm = lab.getVm(uuid);
          log.info("VM: ", vm);
          lab.createTTYSession(vm, key, function(error, auth) {
            if(error) {
              log.error("Error: ", error);
              return socket.emit('error', 'Error creating terminal session.');
            }

            vm.term_server.auth = auth;
            socket.emit('lab_ready', vm);
          });
        });
      });
    });

    socket.on('disconnect', function() {
      if(labInit) {
        console.log('Lab connection closed. Should teardown any available lab.');
      }
    });
  });


  /*
   * Compiler
   * Events:
   *   init - initializes the compiler sandbox
   *   compile - compile current asset
   *   line - emits an console output line
   *   streamEnd - end of output stream
   */
  io
    .of('/compiler')
    .on('connection', function (socket) {
    var compiler = mcClient.compiler;
    var currentSandbox;

    socket.on('init', function(assetId) {
      compiler.create({
        kitName: '10xeng-java', // TODO: hardcoded
        asset: 'http://dev.10xEngineer.me/tarball/' + assetId,
        keypair: 'whoCares??' // TODO: hardcoded
      }, function(error, sandbox) {
        currentSandbox = sandbox;
      });
    });

    socket.on('compile', function(){
      if(!currentSandbox) {
        return socket.emit('error', 'Sandbox not initialized.');
      }

      currentSandbox.compile(null, function(error, res) {
        var data = '';
        res.on('data', function(chunk) {
          data += chunk;

          var tmp = data.split('\n');
          data = tmp.pop();

          for(var line in tmp) {
            socket.emit('line', line);
          }
        });

        res.on('end', function() {
          socket.emit('streamEnd');
        });
      });
    });

    socket.on('run', function(){
      if(!currentSandbox) {
        return socket.emit('error', 'Sandbox not initialized.');
      }

      currentSandbox.run(null, function(error, res) {
        var data = '';
        res.on('data', function(chunk) {
          data += chunk;

          var tmp = data.split('\n');
          data = tmp.pop();

          for(var line in tmp) {
            socket.emit('line', line);
          }
        });

        res.on('end', function() {
          socket.emit('streamEnd');
        });
      });
    });
  });


};

// TODO: Get key from progress->lesson. Maybe write a util lib to navigate progress?
function getOrGenerateKeyPair(lessonId, progressId, callback) {
  var Progress = model.Progress;

  Progress.findById(progressId, function(error, progress) {
    var chapterId = navigateProgress(progress, lessonId);
    var lesson = progress.chapters[chapterId].lessons[lessonId];

    if(!lesson.sysAdmin || !lesson.sysAdmin.key) {
      // Create a new pair
      mcClient.keyManager.create(progressId, function(error, key) {
        if(error) {
          return callback(error);
        }

        if(!lesson.sysAdmin) {
          lesson.sysAdmin = {};
        }
        lesson.sysAdmin.key = key;
        progress.markModified('chapters');
        progress.save(function(error) {
          callback(null, key);
        });
      });
    } else {
      callback(null, lesson.sysAdmin.key);
    }
  });
}

function navigateProgress(progress, origLessonId) {
  var chapters = progress.chapters;

  for (var chapterId in chapters) {
    if(chapters.hasOwnProperty(chapterId)) {
      var lessons = chapters[chapterId].lessons;

      for (var lessonId in lessons) {
        if(lessons.hasOwnProperty(lessonId) && lessonId === origLessonId) {
          return chapterId;
        }
      }
    }
  }
}

function createOrResumeLab(lessonId, progressId, key, callback) {
  var Progress = model.Progress;

  Progress.findById(progressId, function(error, progress) {
    var chapterId = navigateProgress(progress, lessonId);
    var lesson = progress.chapters[chapterId].lessons[lessonId];

    if(!lesson.sysAdmin || !lesson.sysAdmin.lab) {
      // Create a lab
      var data = {
        name: progressId,
        definition: 'https://github.com/10xEngineer/wip-lab-definition-basicvm.git', //TODO: hardcoded
        keypair: key.name
      };
      mcClient.labManager.create(data, function(error, lab) {
        if(error) {
          return callback(error);
        }
        if(!lesson.sysAdmin) {
          lesson.sysAdmin = {};
        }

        lesson.sysAdmin.lab = lab.name;
        progress.markModified('chapters');
        progress.save(function(error) {
          if(error) return callback(error);
          var version = '0.0.1'; // TODO: Hardcoded

          // TODO: Hack to ensure the MC server accepts release request
          setTimeout(function() {
            lab.release(version, function(error) {
              if(error) return callback(error);
              callback(null, lab);
            });
          }, 5000);
        });
      });
    } else {
      var lab = new Lab(mcClient.labManager.origEndpoint, lesson.sysAdmin.lab);
      lab.refresh(function(error) {
        if(error) return callback(error);
        callback(null, lab);
      });
    }
  });
}


