window.progressSocket = io.connect('/progress');
window.codeSocket = io.connect('/code');
window.newCodeSocket = io.connect('/codeNew');

progressSocket.on('connect', function() {
  
});

function displayMessage(type, message) {
  var $alertContainer = $('.alertContainer');
  var typeClass = 'alert-block';

  if(type) {
    typeClass = 'alert-' + type;
  }

  $alertContainer.html('');

  $('<div/>', {
    class: "alert " + typeClass
  }).append($('<a/>', {
    class: 'close',
    'data-dismiss': 'alert',
    href: '#',
    html: 'x'
  })).append($('<p/>', {
    html: message
  })).appendTo($alertContainer);
}