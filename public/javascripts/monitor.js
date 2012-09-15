window.progressSocket = io.connect('/progress');
window.codeSocket = io.connect('/code');
window.newCodeSocket = io.connect('/codeNew');
window.labSocket = io.connect('/labs');

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

// Initialize header animation
$(function () {
    $('.header .left, .header .right')
        .mouseover(function () {
            $('.header').stop().animate({top:0});
        })
        .mouseout(function () {
            $('.header').stop().animate({top:-85});
        });
    $('#editor').css({height:'800px'});
});
