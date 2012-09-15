$(document).ready(function() {
  var progressId = $('#progressId').val();
  var lessonId = $('#lessonId').val();

  // Send signal to initialize the lab instance
  displayMessage('info', "Bootstrapping a new lab instance...");
  labSocket.emit('lab_init', lessonId, progressId);

  labSocket.on('lab_ready', function(data) {
    // TODO: Initialize terminal
    console.log(data);

    var server = data.term_server;

    tty.open('http://' + server.auth.id + ':' + server.auth.secret + '@' + server.host + ':' + server.client_port);
  });

  labSocket.on('error', function(error) {
    console.log(error);
    var error = error || 'Unknown error. Please contact support.';
    //error = '<pre>' + error + '</pre>';
    displayMessage('error', error);
  });

});