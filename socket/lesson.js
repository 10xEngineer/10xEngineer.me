var request = require('request');
var wsdlurl = 'http://ideone.com/api/1/service.json';

module.exports = function(io) {

  /*
  *  Progess: Responsible for tracking a user's course progress
  *  Events:
  *    change - Emitted by client upon change in user's progress, sending the change description as a message.
  *    status - Emitted upon change of status of an entity (course/chapter/lesson status not-started/ongoing/completed)
  *    persist - Persists current user session in mongodb upon emitted. It is emitted periodically/before session expiry
  */
  io.of('/progress')
    .on('connection', function (socket) {

    socket.on('change', function(data){
      log.info(data);
      
    });


  };




  io
    .of('/code')
    .on('connection', function (socket) {
      socket.on('submitcode', function(data){
      log.info(data);
      request(
          { method: 'GET'
          , uri: wsdlurl
        , json: {
              jsonrpc: "2.0",
              method: "createSubmission", 
              params: 
              {
                user: "velniukas", 
                pass: "limehouse", 
                sourceCode: data.source,
                language: data.language, //javascript
                input:true, //this is a parameter bug of the ideone API, it supposes to be a run time input, instead of an indicator to run code
                run:true
              }, 
              "id": 1
            }
          }
        , function (error, response, body) {
          log.info(body);
              socket.volatile.emit('codesent', body);
          }
        );
    });
    
    socket.on('getSubmissionStatus', function(data){
      request(
          {
            method:'GET',
            uri: wsdlurl,
            json:{
              jsonrpc: "2.0",
              method: "getSubmissionStatus", 
              params: 
              {
                user: "velniukas", 
                pass: "limehouse",
                link: data.linkCode
              }, 
              "id": 1
            }
          },
          function(error, response, body){
            log.info(body);
            socket.volatile.emit('submissionStatus', body);
          }
          );
    });
    
    socket.on('getSubmissionDetails', function(data){
      request(
        {
          method:'GET',
          uri: wsdlurl,
          json:{
            jsonrpc: "2.0",
            method: "getSubmissionDetails", 
            params: 
            {
              user: "10xengineer", 
              pass: "secret",
              link: data.linkCode, 
              withSource: true,
              withOutput: true,
              withCmpinfo: true,
              withStderr: true
            }, 
            "id": 1
          }
        },
        function(error, response, body){
          log.info(body);
          socket.volatile.emit('submissionDetails', body);
        }
      );
    }); 
  });

};
