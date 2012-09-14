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

  //- new Chat($('#chat'), '#{username}');

  newCodeSocket.on('codePassed', function(data) {
    displayMessage('success', 'Congratulations, your code compiled successfully.');

  });

  newCodeSocket.on('codeFailed', function(error) {
    console.log(error);
    var error = error || 'Unknown error. Please contact support.';
    error = '<pre>' + error + '</pre>';
    displayMessage('error', error);

  });

  $('#compile').click(function() {
    var sourceCode = editor.getContent();
    var languageCode = $('#pageslide #mode').val();
    if(!languageCode){
      languageCode = $('#mode').val();
    }
    displayMessage('info', 'Compiling...');
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
});