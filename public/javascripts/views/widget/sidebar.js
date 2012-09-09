/********
*
* Exports
*
********/

/*** /Exports ***/


(function() {

$(document).ready(function() {
  $('.widget_sidebar').each(function(index, element) {
    new Sidebar($(element));
  });
});

var Sidebar;

Sidebar = (function() {
  
  function Sidebar(element) {
    var self = this;
    this.setSidebarElement(element);
    this.left = (element.hasClass('left') * 2) -1; // this.left is 1 if left, otherwise -1
    this.updateClassStates();
    
    var api = this.exposeApi.call(this);
    element.data(api);
    
    element.children('.collapse-handle').click(function() {
      self.collapse.call(self);
    });
    element.children('.expand-handle').click(function() {
      self.expand.call(self);
    });
    dragElement = element.children('.collapse-handle,.expand-handle,.resize-handle');
    dragElement.on('mousedown.drag', function(event) {
      self.startDrag.call(self, dragElement, event);
    })
  }

  Sidebar.prototype = new EventEmitter2({
    wildcard: true,
    delimiter: '::',
    maxListeners: 20
  });
  
  Sidebar.prototype.setSidebarElement = function(element) {
    this.element = element;
    return this;
  };
  
  Sidebar.prototype.getSidebarElement = function() {
    return this.element;
  };
  
  Sidebar.prototype.updateClassStates = function() {
    var element = this.getSidebarElement();
    if (element.width() > 0) {
      element.removeClass('expandable');
      element.addClass('collapsible');
    }
    else {
      element.removeClass('collapsible');
      element.addClass('expandable');
    }
  };
  
  Sidebar.prototype.collapse = function() {
    var element = this.getSidebarElement();
    element.width('0px');
    this.updateClassStates();
  };
  
  Sidebar.prototype.expand = function() {
    var element = this.getSidebarElement(),
      width = this.previousWidth;
    if ((typeof width !== "undefined" && width !== null) && width > 0) {
      element.width(width);
    }
    else {
      element.width('');
    }
    this.updateClassStates();
  };
  
  Sidebar.prototype.startDrag = function(dragElement, event) {
    var width = this.getSidebarElement().width();
    if (width > 0) {
      this.previousWidth = width;
    }
    this._dragX = event.pageX;
    $(document).on('mousemove.drag', this.drag.bind(this));
    $(document).on('mouseup.drag', this.stopDrag.bind(this));
  };
  
  Sidebar.prototype.drag = function(event) {
    var x = event.pageX,
      diff = this.left * (event.pageX - this._dragX),
      element = this.getSidebarElement(),
      width = element.width(),
      newWidth = width + diff;
    if (newWidth < 0) {
      element.width(0);
    }
    // FIXME: Get max width from css
    else if (newWidth > 500) {
      element.width(500);
    }
    else {
      element.width(newWidth);
      this._dragX = event.pageX;
    }
  };
  
  Sidebar.prototype.stopDrag = function() {
    $(document).off('mousemove.drag');
    $(document).off('mouseup.drag');
    this.updateClassStates();
  };
  
  
  Sidebar.prototype.exposeApi = function() {
    return {
      // addTab : this.addTab.bind(this),
      // getTab : this.getTabElementById.bind(this),
      // removeTab : this.removeTab.bind(this),
      // setActiveTab : this.setActiveTab.bind(this)
    };
  };
  
  return Sidebar;
  
})();

  
})();