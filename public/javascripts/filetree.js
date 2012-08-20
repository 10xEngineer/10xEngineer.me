//<<<<<<< HEAD
/*
  // TODO :: Rearrenge function from vfs to json pattern
        
  function showTree(c, fileList) {
    fileList = fileList[0];
    $(c).addClass('wait');
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
      $(c).find('ul:hidden').show();
    });
//    bindTree($ul);
    $ul.appendTo(c);
  }
  
  function bindTree(t) {
    $(t).find('li a').bind('dblclick', function() { // event for double click
      //this.emitter.
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
  showTree( $(element).find('.fileTree.start .root'), json );

};/**/
var Grid = function(element, json) {
  // Generete tree code
  this.fileTree = json;
  this.openFiles = [];

  console.log(this);
  $(element).html('<ul class="fileTree start"><li class="directory expanded root"><a href="#" rel="/">/</a><li></ul>');

  fileList = json;
  var $ul = $('<ul/>', { class: 'fileTree' });
  $(fileList).each(function(index, file) {
    var $item;
    if(file.mime === 'inode/directory') {
      $item = $('<li/>', { class: 'directory collapsed' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name + '/' }));
      $item.children('a').bind('dblclick', function(){
        doubleClickOnDir(this);
      });
      $item.children('a').bind('click', function(){
        selectItem(this);
      });
    } else {
      $item = $('<li/>', { class: 'file' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name }));
      $item.children('a').bind('dblclick', function(){
        openFile(this);
      });
      $item.children('a').bind('click', function(){
        selectItem(this);
      });
    }
    $item.appendTo($ul);
  });
  $ul.appendTo($(element).find('.fileTree.start .root'));
};

Grid.prototype = new EventEmitter2({
  wildcard: true,
  delimiter: '::',
  maxListeners: 20
});

Grid.prototype.create =  function(caller, type) {

  // Procedure to create file
  var $parentDir = $(caller).hasClass('directory') ? $(caller) : $(caller).closest('.directory');
  var path = $parentDir.children('a').attr('rel');
  var name = 'untitled';
  var $item;
  (type=='file')? $item = $('<li/>', { class: 'file' }).append($('<a/>', { html: name, href: '#', rel: path + name })) : $item = $('<li/>', { class: 'directory' }).append($('<a/>', { html: name, href: '#', rel: path + name + '/' }));
  $parentDir.append($item);

  this.emit('create', name, path, type);

  this.rename($item);
};

Grid.prototype.remove = function(caller) {

  var $parentDir = $(caller).hasClass('directory') ? $(caller) : $(caller).closest('.directory');
  var path = $parentDir.children('a').attr('rel');

  console.log(path);
  caller.remove();
 
  this.emit('remove', path);
  
};

Grid.prototype.isFileOpen = function(caller, callback){
  callback(false);
}

Grid.prototype.open = function(caller){
  $('#tabContainer .active').removeClass('active');
  var $tab = $('<li/>', {
    class: 'active'
  }).append($('<a/>',{
    href: "#", 
    'data-toggle': "tab",
    html: $(caller).html() + " "
  }).append($('<i/>', {
    class: 'icon-remove closeTab',
    style: 'opacity: 0.3; z-index: 10;'
  })));

  $tab.find('i').click(function(e){
    console.log("clicked on close btn");
    if (!e)
      e = window.event;

    //IE9 & Other Browsers
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    //IE8 and Lower
    else {
      e.cancelBubble = true;
    }
  });

  $tab.children('a').click(function(){
    console.log("anchor tag");
  });

  $tab.appendTo($('#tabContainer'));
};

Grid.prototype.close = function(path) {

};

Grid.prototype.rename = function(caller) {
  var $input = $('<input/>', {
    type: 'text',
    value: $(caller).children('a').html()
  });

  $(caller).append($input);
  $input.focus();
  var self = this;
  $input.bind({
    keypress: function() {
      if(event.keyCode == 13) {
        self.renameFinished(caller);
      }
    },
    blur: function() {
      self.renameFinished(caller);
    }
  }); 

  //this.emit('rename');
};

Grid.prototype.renameFinished = function(caller) {
  
  var anchor = $(caller).children('a');
  var newPath = oldPath = anchor.attr('rel');
  var oldName = anchor.html();
  var newName = $(caller).children('input').val();
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
    
    caller.children('input').remove();
    anchor.css('display', 'block');
    newPath = anchor.attr('rel');
  }
  else{
    caller.children('input').remove();
  }
  
  // Event emit for rename done 
  this.emit('rename', newPath, oldPath);

};

Grid.prototype.explore = function(caller, json) {
  
  var path = $(caller).attr('rel');
  var $parent = $(caller).parent();
  $parent.removeClass('collapsed').addClass('expanded');

  fileList = json;
  var $ul = $('<ul/>', { class: 'fileTree' });
  $(fileList).each(function(index, file) {
    var $item;
    if(file.mime === 'inode/directory') {
      $item = $('<li/>', { class: 'directory collapsed' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name + '/' }));
      $item.children('a').bind('dblclick', function(){
        doubleClickOnDir(this);
      });
      $item.children('a').bind('click', function(){
        selectItem(this);
      });
    } else {
      $item = $('<li/>', { class: 'file' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name }));
      $item.children('a').bind('dblclick', function(){
        openFile(this);
      });
      $item.children('a').bind('click', function(){
        selectItem(this);
      });
    }
    $item.appendTo($ul);
  });
  $ul.appendTo($parent);

  this.emit('explore', path);
};
/*=======
if(jQuery) (function($){
	
	$.extend($.fn, {
		fileTree: function(vfs) {
			
			$(this).each( function() {
				
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
								$item = $('<li/>', { class: 'file' }).append($('<a/>', { html: file.name, href: '#', rel: file.path + file.name, 'data-type': file.mime }));
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
							var type = $(this).attr('data-type');
							window.editor.loadContent(path);
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
			});
		}
	});
	
})(jQuery);
>>>>>>> f4cf078b086a1269b2432eed31790d8eaa55c5af
*/