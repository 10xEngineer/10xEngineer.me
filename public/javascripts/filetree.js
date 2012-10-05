/*********************************************************************************************************************************

  DOCUMENTATION 
  -------------

  Constructor :
    To create new grid it needs to call a constructor
    as

    var grid = new FileTree(element, json)

    parameters:
      element : is an element where to put tree
      json    : root directory containts in JSON format

  Methods:
    
    * create(element, type)
    -----------------------
    Parameters:
      element : HTML element which is parent of file/dir (which you need to create)
      type    : it have only two value "file" or "directory".

    Event: 
      'create'
      with parameters:
        name : 'untitled' (by defalt)
        path : parent dir path
        type : 'file' or 'directory'

    * remove(element)
    -----------------
    Parameters:
      element : HTML element which file/dir (which you need to remove)

    Event:
      'remove'
      with paramenters:
        path : full path of element to be removed

    * open(element)
    ---------------
    Parameters:
      element : HTML element which file (which you need to open)

    Event:
      'open'
      with parameters:
        path : full path of element to be opened

    * close(element)
    ---------------
    Parameters:
      element : HTML element (TAB) which file (which you need to close)

    Event:
      'close'
      with parameters:
        path : full path of element to be closed

    * expand(element)
    -----------------
    Parameters:
      element : HTML element which directory (which you need to expand)

    Event:
      'expand'
      with parameters:
        path : full path of element to be expand

    * collapse(element)
    -----------------
    Parameters:
      element : HTML element which directory (which you need to collapse)

    Event:
      'collapse'
      with parameters:
        path : full path of element to be collapse

    * rename(element)
    -----------------
    Parameters:
      element : HTML element which file/directory (which you need to rename)

    Event:
      'rename'
      with parameters;
        newPath : full new path of renamed element
        oldPath : full old path of renamed element

      NOTE: this event will fiers after UI rename operation is being completed.

    * refresh(treeJSON)
    -------------------
    Parameters:
      treeJSON : tree object in form of JSON

    Event:
      'refresh'
      with parameters;
        treeJSON : current tree in form of JSON
    
    * getSelected()
    ---------------
    Returns:
      path : full path of selected element


*********************************************************************************************************************************/


define(['eventemitter2'], function(EventEmitter2) {

  function FileTree(element, json) {
    var self = this;

    this.fileCount = 1;

    // Generete tree code
    this.fileTree = json;

    $(element).html('<ul class="fileTree start"><li class="directory expanded root"><a href="#" rel="/">/</a><li></ul>');

    fileList = json;
    var $ul = $('<ul/>', { class: 'fileTree' });
    $(fileList).each(function(index, file) {
      var $item;
      if(file.mime === 'inode/directory') {
        $item = $('<li/>', { class: 'directory collapsed' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name + '/' }));
        $item.children('a').bind('dblclick', function(){
          self.openDir(this);
        });
        $item.children('a').bind('click', function(){
          self.selectItem(this);
        });
      } else {
        $item = $('<li/>', { class: 'file' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name }));
        $item.children('a').bind('dblclick', function(){
          self.openFile(this);
        });
        $item.children('a').bind('click', function(){
          self.selectItem(this);
        });
      }
      $item.appendTo($ul);
    });
    $ul.appendTo($(element).find('.fileTree.start .root'));
  };

  FileTree.prototype = new EventEmitter2({
    wildcard: true,
    delimiter: '::',
    maxListeners: 20
  });

  FileTree.prototype.create =  function(caller, type) {
    var self = this;

    // Procedure to create file
    var $parentDir = $(caller).hasClass('directory') ? $(caller) : $(caller).closest('.directory');
    var path = $parentDir.children('a').attr('rel');
    var name = 'NewFile' + self.fileCount++;
    var $item;
    if(type=='file'){
      $item = $('<li/>', { class: 'file itsNew' }).append($('<a/>', { html: name, href: '#', rel: path + name }));
      $item.children('a').bind('dblclick', function(){
        self.openFile(this);
      });
      $item.children('a').bind('click', function(){
        self.selectItem(this);
      });
    } else {
      $item = $('<li/>', { class: 'directory itsNew' }).append($('<a/>', { html: name, href: '#', rel: path + name + '/' }));
      $item.children('a').bind('dblclick', function(){
        self.openDir(this);
      });
      $item.children('a').bind('click', function(){
        self.selectItem(this);
      });
    }
    if($parentDir.hasClass('collapsed')){
      self.openDir($parentDir.children('a'), function(){
        $parentDir.children('ul').append($item);
        self.rename($item);
      });
    }   
    else {
      var $ul;
      if($parentDir.children('ul').length == 0) $('<ul/>', {class: 'fileTree'}).appendTo($parentDir);
      $ul = $parentDir.children('ul');
      $ul.append($item);
      self.rename($item);
    }

    // this.emit('create', name, path, type);
  };

  FileTree.prototype.remove = function(caller) {
    var self = this
    var path = $(caller).children('a').attr('rel');
    createModal();
    setModalData({
      body: 'Really want to remove...',
    }, function(error, $modal){
      $modal.find('.modal-footer a.btn.btn-danger').click(function(){
        self.emit('remove', path, caller);
      });
      $modal.modal('show');
    });

    // caller.remove();
    // this.emit('remove', path);
  };

  FileTree.prototype.getSelected = function() {
    var selected = $('.selected');
    if (typeof selected === "undefined" || selected === null) {
      selected = $('.filetree .root');
    }
    var path = selected.attr('rel');
  }

  FileTree.prototype.openDir = function(element, callback) {
    var self = this;
    var $parent = $(element).parent();
    var path = $(element).attr('rel');
    if($parent.hasClass('collapsed')) {
      this.emit('openDir', path, element, callback);
    } else {
      self.collapse(element);
    }
  };


  FileTree.prototype.openFile = function(element) {
    var path = $(element).attr('rel');
    this.emit('openFile', path);
  }

  FileTree.prototype.open = function(caller){
  };

  FileTree.prototype.close = function(caller) {
    var self = this;
    var $currTab = $(caller).parent()
    var $tabList = $('#tabContainer li');
    if($tabList.length > 1){
      var nextActiveTab;
      for (var i = 0; i < $tabList.length; i++) {
        var found = ($($tabList[i]).attr('rel') == $currTab.attr('rel') && $($tabList[i]).html() == $currTab.html());
        var condition = ( found && !(typeof(nextActiveTab)=='undefined'));
        if(condition) {
          break;
        } else {
          nextActiveTab = $tabList[i];
        }
      };
      $currTab.removeClass('active');
      $(nextActiveTab).addClass('active');
    }
  }

  FileTree.prototype.selectItem = function(element) {
    $('.selected').removeClass('selected');
    $(element).addClass('selected');
  }


  FileTree.prototype.openFile = function(element) {
    var path = $(element).attr('rel');
    this.emit('openFile', path);
  }

  FileTree.prototype.open = function(caller){
  };

  FileTree.prototype.close = function(caller) {
    var self = this;
    var $currTab = $(caller).parent()
    var $tabList = $('#tabContainer li');
    if($tabList.length > 1){
      var nextActiveTab;
      for (var i = 0; i < $tabList.length; i++) {
        var found = ($($tabList[i]).attr('rel') == $currTab.attr('rel') && $($tabList[i]).html() == $currTab.html());
        var condition = ( found && !(typeof(nextActiveTab)=='undefined'));
        if(condition){
          break;
        } else {
          nextActiveTab = $tabList[i];
        }
      };
      $currTab.removeClass('active');
      $(nextActiveTab).addClass('active');
    }
    self.emit('closeTab', $currTab.children('a').attr('rel'));
    if($('#tabContainer li.active')) { 
      self.emit('openTab', $('#tabContainer li.active').children('a').attr('rel'));
    }
    $currTab.remove();
  };

  FileTree.prototype.rename = function(caller) {
    var name = $(caller).children('a').html();
    var $input = $('<input/>', {
      type: 'text',
      value: name
    });

    $(caller).children('a').html("");
    $(caller).append($input);

    $input.focus().select();
    var self = this;
    $input.bind({
      keypress: function() {
        if(event.keyCode == 13) {
          self.renameFinished(caller, name);
        }
      },
      blur: function() {
        self.renameFinished(caller, name);
      }
    }); 

    //this.emit('rename');
  };

  FileTree.prototype.renameFinished = function(caller, oldName) {
    var anchor = $(caller).children('a');
    var newPath = oldPath = anchor.attr('rel');
    var newName = $(caller).children('input').val();
    caller.children('input').remove();  
    if(newName.trim() != "") {
      anchor.html(newName);
      var path = anchor.attr('rel');
      if(caller.hasClass('file')) {
        var pattern = new RegExp(oldName + "$");
        anchor.attr('rel', path.replace(pattern, newName));
      } else {
        var pattern = new RegExp(oldName + "\\/$");
        anchor.attr('rel', path.replace(pattern, newName)+"/");
      }
      newPath = anchor.attr('rel');
    }
    
    // Event emit for rename done 
    var p = anchor.parent('li');
    var parentDir = p.parent().parent()
    var parentAnchor = parentDir.children('a');
    if(p.hasClass('itsNew')){
      var type = p.hasClass('file') ? 'file': 'directory';
      var name = anchor.html();
      var path = parentAnchor.attr('rel');
      p.removeClass('itsNew');
      this.emit('create', name, path, type, caller);
    } else {
      this.emit('rename', newPath, oldPath, function(){
        anchor.html(newName);
      });
    }

  };

  FileTree.prototype.expand = function(caller, json) {
    var self = this;
    var path = $(caller).attr('rel');
    var $parent = $(caller).parent();

    // Code To append JSON
    var tmp = json;
    var indx = 0
    while(indx < tmp.length){
      this.fileTree.push(tmp[indx]);
      indx ++;
    }
    // Append JSON code completed
    $parent.removeClass('collapsed').addClass('expanded');

    fileList = json;
    var $ul = $('<ul/>', { class: 'fileTree' });
    $(fileList).each(function(index, file) {
      var $item;
      if(file.mime === 'inode/directory') {
        $item = $('<li/>', { class: 'directory collapsed' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name + '/' }));
        $item.children('a').bind('dblclick', function(){
          self.openDir(this);
        });
        $item.children('a').bind('click', function(){
          self.selectItem(this);
        });
      } else {
        $item = $('<li/>', { class: 'file' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name }));
        $item.children('a').bind('dblclick', function(){
          self.openFile(this);
        });
        $item.children('a').bind('click', function(){
          self.selectItem(this);
        });
      }
      $item.appendTo($ul);
    });
    $ul.appendTo($parent);
    $parent.removeClass('collapsed').addClass('expanded');  
    this.emit('expand', path);
  };

  FileTree.prototype.collapse = function(caller){
      var $parent = $(caller).parent();
      var path = $(caller).attr('rel');

      var regex = new RegExp("^" + escape(path) + "$");
      var indx = 0;
      while(indx < this.fileTree.length) {
        var tmpPath = this.fileTree[indx]['path'];
        if(regex.test(tmpPath)) {
          this.fileTree.splice(indx, 1);
        } else {
          indx++;
        }
      }

      $parent.removeClass('expanded').addClass('collapsed');
      $parent.children('ul').remove();

      this.emit('collapse', path);
  };

  FileTree.prototype.refresh = function(json) {
    var self = this;

    if(typeof(json)!='undefined'){
      this.fileTree = json ;
    }

    var element = $('#tree');
    $(element).html('<ul class="fileTree start"><li class="directory expanded root"><a href="#" rel="/">/</a><li></ul>');

    var currLength = 0;
    var tmp = this.fileTree;
    var appenderList = {
      "/": $(element).find('li.directory.root').get(0)
    }
    while(currLength < tmp.length) {
      var file = tmp[currLength++];
      var path = file.path;
      if(appenderList.hasOwnProperty(path)){
        // Code to append element
        var appender = appenderList[path];
        var $ul;
        if($(appender).children('ul').length != 0){
          $ul = $(appender).children('ul');
        } else {
          $ul = $('<ul/>', { class: 'fileTree' });
          $ul.appendTo($(appender));
          $(appender).removeClass('collapsed').addClass('expanded');
        }
        var $item;
        if(file.mime === 'inode/directory') {
          $item = $('<li/>', { class: 'directory collapsed' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name + '/' }));
          $item.children('a').bind('dblclick', function(){
            self.openDir(this);
          });
          $item.children('a').bind('click', function(){
            self.selectItem(this);
          });
          // Code to add appender
          appenderList[file.path+file.name+"/"] = $item.get(0);
        } else {
          $item = $('<li/>', { class: 'file' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name }));
          $item.children('a').bind('dblclick', function(){
            self.openFile(this);
          });
          $item.children('a').bind('click', function(){
            self.selectItem(this);
          });
        }
        $item.appendTo($ul);
      } else {
        console.log("File "+file.name+" can't be append.");
      }
    }
    this.emit('refresh', this.fileTree);
  };

  return FileTree;

});
