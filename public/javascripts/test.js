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

};

var doubleClickOnDir = function(element) {
  var $parent = $(element).parent();
  
  path = $(element).attr('rel');
  console.log(path);
  vfs.readDir(path, function(json){
    grid.explore(element, json);
  });
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
  console.log(json);
  window.grid = new Grid($('#tree'), json);  
  bindEvent();
});