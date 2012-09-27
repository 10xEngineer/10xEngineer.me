// Bootstrap

require.config({
  paths: {
    'jquery': '/javascripts/jquery-1.7.1.min',
    'jquery-ui': '/javascripts/jquery-ui-1.8.16.custom.min',
    'bootstrap': '/javascripts/bootstrap.min',
    'contextMenu': '/javascripts/jquery.contextMenu',
    'easing': '/javascripts/jquery.easing-1.3.pack',
    'filedrop': '/javascripts/jquery.filedrop',
    'fittext': '/javascripts/jquery.fittext',
    'flexslider': '/javascripts/jquery.flexslider',
    'ipicture': '/javascripts/jquery.ipicture',
    'jcrop': '/javascripts/jquery.Jcrop.min',
    'select2': '/javascripts/select2.min',
    'superagent': '/javascripts/superagent.min',
    'mediaelement': '/javascripts/mediaelement/mediaelement-and-player.min',
    'socket-io': '/socket.io/socket.io',
    'eventemitter2': '/javascripts/eventemitter2',
    'tabbar': '/javascripts/views/widget/tabbar',
    'sidebar': '/javascripts/views/widget/sidebar',
    'ace': '/javascripts/ace'
  },
  shim: {
    'bootstrap': ['jquery'],
    'jquery-ui': ['jquery'],
    'contextMenu': ['jquery'],
    'easing': ['jquery'],
    'filedrop': ['jquery'],
    'fittext': ['jquery'],
    'flexslider': ['jquery'],
    'ipicture': ['jquery-ui'],
    'jcrop': ['jquery'],
    'select2': ['jquery'],
    'mediaelement': ['jquery'],
    'eventemitter2': {
      exports: 'EventEmitter2'
    },
    'filetree': ['eventemitter2'],
  }
});

require(['require',
  'jquery',
  'jquery-ui',
  'bootstrap',
  'contextMenu',
  'easing',
  'filedrop',
  'fittext',
  'flexslider',
  'ipicture',
  'jcrop',
  'select2',
  'mediaelement',
  'socket-io',
  'utils'], function(require, $) {

  window.$ = $;

    /* Some Globale script */
  $(function(){
    $('.main-page h1.responsive-text').fitText(0.7, { minFontSize: '28px', maxFontSize: '60px' });


    // Initialize socket.io connections
    window.progressSocket = io.connect('/progress');
    window.codeSocket = io.connect('/code');
    window.newCodeSocket = io.connect('/codeNew');
    window.labSocket = io.connect('/labs');

    progressSocket.on('connect', function() {
      
    });

    if(typeof(init) === 'function') { 
      init(); 
    }
  });

  // TODO: public
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

});