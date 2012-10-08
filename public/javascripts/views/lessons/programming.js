
define(['vfs-client', 'editor'], function(VFSClient, Editor) {

  var docId = $('#docId').val();

  

  //dynamically load javascript source file
  function loadScriptFile(path, callback) {
    var head = document.getElementsByTagName('head')[0];
    var s = document.createElement('script');

    s.src = path;
    head.appendChild(s);

    s.onload = callback;
  }

  window.editor = new Editor({
    vfs: new VFSClient(docId),
    tree: '#tree',
    editor: '#editor',
    tab: '#tabContainer'
  });

  function appendLog(message) {
    var $logWindow = $('#chat');

    var lines = message.split('\n');

    for (var index in lines) {
      var line = lines[index];
      $logWindow.append($('<div/>', { html: line, class: 'log-line' }));      
    }
  }

  //- new Chat($('#chat'), '#{username}');

  newCodeSocket.on('codePassed', function(data) {
    appendLog(data);
    //displayMessage('success', 'Congratulations, your code compiled successfully.');

/*
    console.log(data);
    var data = data;
    data = '<pre>' + data + '</pre>';
    displayMessage('info', data);
*/
  });

  newCodeSocket.on('codeFailed', function(error) {
    console.log(error);
    var error = error || 'Unknown error. Please contact support.';
    appendLog(error);
    //error = '<pre>' + error + '</pre>';
    //displayMessage('error', error);

  });

  $('#compile').click(function() {
    var sourceCode = editor.getContent();
    var languageCode = $('#pageslide').find('#mode').val();
    if(!languageCode){
      languageCode = $('#mode').val();
    }
    //displayMessage('info', 'Compiling...');
    appendLog('Compiling...');
    newCodeSocket.emit('submitcode', docId);
  });

  //- sharejs.open('#{docId}_json', 'json', function(error, doc) {
  //-   if (error) {
  //-     console.error(error);
  //-     return;
  //-   }
  //-   //doc.attach_editor(editor);
  //- });

  $('#save').click(function() {
    editor.saveFile();
    return false;
  });
  
  $('#newfile').click(function() {
    editor.tree.create($('.selected'), 'file');
    return false;
  });
  
  $('#newfolder').click(function() {
    editor.tree.create($('.selected'), 'directory');
    return false;
  });
  
  var resizeInterval;
  $('#fullscreen').click(function() {
    if ($('body').hasClass('fullscreen')) {
      $('body').removeClass('fullscreen');
    }
    else {
      $('.widget_sidebar.left').data().expand();
      $('body').addClass('fullscreen');
    }
    resizeInterval = setInterval(function() {
      editor.resize();
    }, 10);
    setTimeout(function() {
      clearInterval(resizeInterval);
    }, 700)
  });
  
  $('.widget_sidebar').on('transitionend webkitTransitionEnd oTransitionEnd', function(event) {
    editor.resize();
    clearInterval(resizeInterval);
    $(event.target).data().updateClassStates();
  });
  
});
