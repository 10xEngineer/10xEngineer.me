// Create Grid
window.vfs = new VFSClient('test');


var themes = {};
var modes = {};

//dynamically load javascript source file
function loadScriptFile(path, callback) {
  var head = document.getElementsByTagName('head')[0];
  var s = document.createElement('script');

  s.src = path;
  head.appendChild(s);

  s.onload = callback;
}

// UI functions
$.contextMenu({
  selector: '.directory, .file',
  callback: function(key, options) {
    switch(key) {
      case 'newFile':
        grid.create(this, 'file');
        break;
      case 'newDir':
        grid.create(this, 'directory');
        break;
      case 'rename':
        grid.rename(this);
        break;
      case 'remove':
        grid.remove(this);
        break;
    }
  },
  items: {
    newFile: { name: 'New File' },
    newDir: { name: 'New Directory' },
    rename: { name: 'Rename' },
    remove: { name: 'Remove' }
  }
});


var openFile = function(element) {
  var path = $(element).attr('rel');
  grid.isFileOpen(element, function(fileAllreadyOpen){
    if(fileAllreadyOpen) {
      // code to focus on that file
    } else {
      // code to actually open the file
      vfs.readFile(path, function(data){
        grid.open(element, data);
      });
    }
  });
};

var doubleClickOnDir = function(element) {
  var $parent = $(element).parent();
  var path = $(element).attr('rel');
  if($parent.hasClass('collapsed')) {
    vfs.readDir(path, function(json){
      grid.expand(element, json);
    });
  } else {
    grid.collapse(element);
  }
};

var selectItem = function(element) {
  $('.selected').removeClass('selected');
  $(element).addClass('selected');
};

var bindEvent = function() {

  // CREATE EVENT
  grid.on('create', function(name, path, type) {
    if((type=='file')){
      vfs.newFile(name, path, function(err){
        cosole.log("Get Call back of file creation at VFS.");
        if(err){
          console.log("Error in "+type+" creation.");
        } else {
          console.log(type+" has been created successfully.");
        }
      });
    } else {
      vfs.newDir(name, path, function(err){
        if(err){
          console.log("Error in "+type+" creation.");
        }
        else{
          console.log(type+" has been created successfully.");
        }
      });
    }
  });

  grid.on('openTab', function(path){
    console.log("Testing of catch event"+path);
  });

  // RENAME EVENT
  grid.on('rename', function(newName, oldName){
    vfs.rename(newName, oldName, function(){
      console.log("Test Callback");
    });
  });

  // REMOVE EVENT
  grid.on('remove', function(path){
    if(/\/$/.test(path)){
      vfs.removeDir(path, function(error) {
        if(!error) {
          caller.remove();
        }
      });
    } else {
      vfs.removeFile(path, function(error) {
        if(!error) {
          caller.remove();
        }
      });
    }
  });
};

var initTabs = function(){
  var tabs = editor.tabs;
  for (var path in tabs) {
    var containt = tabs[path];
    openTab(path, containt);
  }
};

var openTab = function(path, containt) {
  var $list = $('#tree').find('a');
  $list.each(function(index, element) {
    if($(element).attr('rel') == path){
      return grid.open(element);
    }
  });
};

vfs.readDir('/', function(json) {
  window.grid = new Grid($('#tree'), json);
  bindEvent();
  initTabs();
});

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
  var sourceCode = editor.getSession().getValue();
  var languageCode = $('#pageslide #mode').val();
  if(!languageCode){
    languageCode = $('#mode').val();
  }
  displayMessage('info', 'Compiling...');
  newCodeSocket.emit('submitcode', 'test');
});

sharejs.open('#{docId}', 'text', function(error, doc) {
  if (error) {
    console.error(error);
    return;
  }
  doc.attach_ace(editor);
  editor.setReadOnly(false);
});

$('#save').click(function() {
  var path = $('.selected').attr('rel');
  var content = editor.getSession().toString();
  console.log(content);
  vfs.saveFile(path, content, function() {
    console.log('saved');
  });
  return false;
});
