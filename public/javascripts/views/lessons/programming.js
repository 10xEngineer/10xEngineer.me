$(document).ready(function() {
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
    var languageCode = $('#pageslide #mode').val();
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
  
  $('#').click(function() {
    editor.newFile();
    return false;
  });
  
  $('#').click(function() {
    editor.newFolder();
    return false;
  });
  
});