$(document).ready(function() {
  var progressId = $('#progressId').val();

  // Send signal to initialize the lab instance
  labSocket.emit('lab_init', progressId);

  labSocket.on('lab_ready', function(data) {
    // TODO: Initialize terminal
    console.log(data);
  });

  labSocket.on('error', function(error) {
    console.log(error);
    var error = error || 'Unknown error. Please contact support.';
    error = '<pre>' + error + '</pre>';
    displayMessage('error', error);
  });

});