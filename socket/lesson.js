var async = require('async');
var request = require('request');
var progressHelper = load.helper('progress');
var wsdlurl = 'http://ideone.com/api/1/service.json';

var util = load.helper('util');

var Lesson = load.model('Lesson');

var languages = {
  'javascript': 112
};
var defaultParams = {
  user: "velniukas",
  pass: "limehouse"
};

module.exports = function(io) {

  /*
  *  Progess: Responsible for tracking a user's course progress
  *  Events:
  *    change - Emitted by client upon change in user's progress, sending the change description as a message.
  *    status - Emitted upon change of status of an entity (course/chapter/lesson status not-started/ongoing/completed)
  *    persist - Persists current user session in mongodb upon emitted. It is emitted periodically/before session expiry
  */
  io
    .of('/progress')
    .on('connection', function (socket) {
      
      // Video Progress
      socket.on('change', function(data){
        progressHelper.lessonUpdateProgress(data, socket.handshake.session);
      });
      
      // Video Completed
      socket.on('status', function(data){
        log.info('Data :', data);
        progressHelper.lessonCompleted(data, socket.handshake.session);
      });

      // Persists current user session in mongodb
      socket.on('persist', function(data){
        progressHelper.update(data, socket.handshake.session.progress);
      });

    });

  io
    .of('/code')
    .on('connection', function (socket) {
    
    socket.on('submitcode', function(data){
      log.info(data);

      Lesson.findOne({ id: data.lessonId }, function(error, lesson) {
        if(error) {
          log.error(error);
        }

        log.info(lesson);

        async.waterfall([
          function(callback) {
            callIdeoneService('createSubmission', {
              sourceCode: "while(input = readline()) { print(main(input)); } " + data.source,
              language: languages[data.language],
              input: lesson.programming.input + '\n',
              run:true
            },
            function(error, result) {
              if(error) {
                callback(error);
              }

              callback(null, result.link);
            });
          },
          waitForSubmissionComplete,
          function(link, callback) {
            callIdeoneService('getSubmissionDetails', {
              link: link,
              withSource: true,
              withOutput: true,
              withCmpinfo: true,
              withStderr: true
            },
            function(error, result) {
              if(error) {
                callback(error);
              }

              callback(null, result);
            });
          }
        ],
        function(error, result) {
          log.info(result);

          if(result.output == (lesson.programming.output + '\n')) {
            socket.volatile.emit('codePassed', result);
          } else {
            result.error = 'Output did not match the expected output. Expected: "' + lesson.programming.output + '" Current: "' + result.output + '"';
            socket.volatile.emit('codeFailed', result);
          }
        });
      });
    });
  });

};

var callIdeoneService = function(method, params, callback) {
  params = util.merge(defaultParams, params);  
  request({
    method: 'GET',
    uri: wsdlurl,
    json: {
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: 1
    }
  },
  function (error, res, body) {
    if(error) {
      log.error(error);
      return callback(error);
    }
    log.info(res.request.body.toString());
    if(body.result.error != 'OK') {
      log.error(body.result.error);
      return callback(body.result.error);
    }

    callback(null, body.result);
  });
};

var waitForSubmissionComplete = function(link, callback) {
  setTimeout(function() {
    callIdeoneService('getSubmissionStatus', {
      link: link
    },
    function(error, result){
      if(error) {
        return callback(error);
      }

      if(result.status !== 0) {
        return waitForSubmissionComplete(link, callback);
      } else if (result.result !== 15){
        callback(result.result);
      } else {
        callback(null, link);
      }
    });
  }, 1000);
};
