/*
var generateTree = function(element, json) {
  json = {
    [ 
      {
        "name": "mock.coffee"
        ,"mime": "application/coffee"
        ,"path": "/"
        ,"href": "http://dev.10xengineer.me:3000/fs/test/mock.coffee"
        ,"size": 0
      }, {
        "name": "untitled"
        ,"mime": "inode/directory"
        ,"path": "/"
        ,"href": "http://dev.10xengineer.me:3000/fs/test/untitled/"
        ,"size": 1
      },{
        "name": "untitled"
        ,"mime": "inode/directory"
        ,"path": "/untitled/"
        ,"href": "http://dev.10xengineer.me:3000/fs/test/untitled/"
        ,"size": 0
      }
    ]
  }

  // TODO :: Rearrenge function from vfs to json pattern
        
  function showTree(c, t) {
    $(c).addClass('wait');
    vfs.readDir(t, function(fileList) {
      $(c).find('.start').html('');
      $(c).removeClass('wait');
      var $ul = $('<ul/>', { class: 'fileTree' });
      $(fileList).each(function(index, file) {
        var $item;
        if(file.mime === 'inode/directory') {
          $item = $('<li/>', { class: 'directory collapsed' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name + '/' }));
        } else {
          $item = $('<li/>', { class: 'file' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name }));
        }
        $item.appendTo($ul);
        if(t === '/') $(c).find('ul:hidden').show(); else $(c).find('ul:hidden').slideDown({ duration: 500 });
      });
      bindTree($ul);
      $ul.appendTo(c);
    });
  }
  
  function bindTree(t) {
    $(t).find('li a').bind('dblclick', function() {
      if( $(this).parent().hasClass('directory') ) {
        if( $(this).parent().hasClass('collapsed') ) {
          $(this).parent().find('ul').remove(); // cleanup
          showTree( $(this).parent(), escape($(this).attr('rel').match( /.*\// )) );
          $(this).parent().removeClass('collapsed').addClass('expanded');
        } else {
          // Collapse
          $(this).parent().find('ul').slideUp({ duration: 500 });
          $(this).parent().removeClass('expanded').addClass('collapsed');
        }
      } else {
        // TODO: Load file content in the editor
        var path = $(this).attr('rel');
        vfs.readFile(path, window.loadFile);
      }
      return false;
    });
    $(t).find('li a').bind('click', function() {
      $('.selected').removeClass('selected');
      $(this).addClass('selected');
      return false;
    });
  }
  // Loading message
  $(this).html('<ul class="fileTree start"><li class="directory expanded root"><a href="#" rel="/">/</a><li></ul>');
  // Get the initial file list
  showTree( $(this).find('.fileTree.start .root'), escape('/') );

};
*/
var GridFS = function(element, vfs) {
  this.emitter = new EventEmitter2({
    wildcard: true,
    delimiter: '::',
    maxListeners: 20
  });
  // Generete tree code
  $(element).each( function() {
    
    function showTree(c, t) {
      $(c).addClass('wait');
      vfs.readDir(t, function(fileList) {
        $(c).find('.start').html('');
        $(c).removeClass('wait');
        var $ul = $('<ul/>', { class: 'fileTree' });
        $(fileList).each(function(index, file) {
          var $item;
          if(file.mime === 'inode/directory') {
            $item = $('<li/>', { class: 'directory collapsed' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name + '/' }));
          } else {
            $item = $('<li/>', { class: 'file' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name }));
          }
          $item.appendTo($ul);
          if(t === '/') $(c).find('ul:hidden').show(); else $(c).find('ul:hidden').slideDown({ duration: 500 });
        });
        bindTree($ul);
        $ul.appendTo(c);
      });
    }
    
    function bindTree(t) {
      $(t).find('li a').bind('dblclick', function() {
        if( $(this).parent().hasClass('directory') ) {
          if( $(this).parent().hasClass('collapsed') ) {
            $(this).parent().find('ul').remove(); // cleanup
            showTree( $(this).parent(), escape($(this).attr('rel').match( /.*\// )) );
            $(this).parent().removeClass('collapsed').addClass('expanded');
          } else {
            // Collapse
            $(this).parent().find('ul').slideUp({ duration: 500 });
            $(this).parent().removeClass('expanded').addClass('collapsed');
          }
        } else {
          // TODO: Load file content in the editor
          var path = $(this).attr('rel');
          vfs.readFile(path, window.loadFile);
        }
        return false;
      });
      $(t).find('li a').bind('click', function() {
        $('.selected').removeClass('selected');
        $(this).addClass('selected');
        return false;
      });
    }
    // Loading message
    $(element).html('<ul class="fileTree start"><li class="directory expanded root"><a href="#" rel="/">/</a><li></ul>');
    // Get the initial file list
    showTree($(element).find('.fileTree.start .root'), escape('/') );
  });
};

GridFS.prototype = {

  addListener: function(eventObj, listener){
    return this.emitter.addListener(eventObj, listener);
  },

  emit: function(eventObj) {
    return this.emitter.emit(eventObj);
  }

}
