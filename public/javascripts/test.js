// Create Grid
window.vfs = new VFSClient('test');

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
  var fileAllreadyOpen = grid.isFileOpen(element);
  if(fileAllreadyOpen) {
    // code to focus on that file
  } else {
    // code to actually open the file
    vfs.readFile(path, function(data){
      grid.open(element, data);
    });
  }
};

var doubleClickOnDir = function(element) {
  var $parent = $(element).parent();
  var path = $(element).attr('rel');
  if($parent.hasClass('collapsed')) {
    $parent.removeClass('collapsed').addClass('expanded');  
    vfs.readDir(path, function(json){
      console.log(json);
      grid.explore(element, json);
    });
  } else {
    $parent.removeClass('expanded').addClass('collapsed');
    $parent.children('ul').remove();
  }
};

var selectItem = function(element) {
  $('.selected').removeClass('selected');
  $(element).addClass('selected');
};

var bindEvent = function() {

  // CREATE EVENT
  grid.on('create', function(name, path, type) {
    console.log("Inside create event");
    console.log(type);
    if((type=='file')){
      console.log("Inside if-file");
      console.log(name);
      console.log(path);
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

  // RENAME EVENT
  grid.on('rename', function(newName, oldName){
    vfs.rename(newName, oldName, function(){
      console.log("Get Callback");
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

vfs.readDir('/', function(json) {
  window.grid = new Grid($('#tree'), json);  
  bindEvent();
});

// vfs.newDir('sample', '/test/', function(){
//   console.log("get Callback.");
// });