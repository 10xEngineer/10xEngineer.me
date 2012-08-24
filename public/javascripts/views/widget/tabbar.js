/********
*
* Exports
*
********/
var views_tabbar_create;
/*** /Exports ***/


(function() {

var TabBar;

TabBar = (function() {

  function TabBar(initialState) {
    var tab, _i, _len, _ref;
    _ref = initialState.tabs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tab = _ref[_i];
      this.addTab(tab);
    }  
    this.setActiveTab(initialState.activeTab);
  }
  views_tabbar_create = function(initialState) {
    tabBar = new TabBar(initialState);
    api = tabBar.exposeApi.call(tabBar);
    tabBar.getTabBarElement().data(api);
    return tabBar;
  };
  
  
  TabBar.prototype.getTabBarElement = function() {
    return $('#tabBar');
  }
  
  
  TabBar.prototype.addTab = function(options) {
    var id = options.id,
      title = options.title;
    var tabElement = this.createTabElement(id, title);
    this.appendTabElement(tabElement);
    this.getTabBarElement().triggerHandler('TabAddedEvent', id);
    this.setActiveTab(id);
  };
  
  
  TabBar.prototype.removeTab = function(id) {
    this.setActiveTab(this.nextActiveTab());
    element = this.removeTabElement(id);
    this.getTabBarElement().triggerHandler('TabRemovedEvent', id);
    this.destroyTabElement(element);
  }
  
  
  TabBar.prototype.createTabElement = function(id, title) {
    var _self = this;
    return element = $('<div/>', {
      'class' : 'tab ' + id,
      text    : title
    }).click(function() {
      _self.setActiveTab(id);
    });
  }
  
  
  TabBar.prototype.destroyTabElement = function(element) {
    return element.remove();
  }
  
  
  TabBar.prototype.appendTabElement = function(element, index) {
    previousElement = $('#tabBar .tab').eq(index);
    if (previousElement.length !== 0) {
      return previousElement.after(element);
    }
    else {
      return $('#tabBar').append(element);
    }
  }
  
  
  TabBar.prototype.removeTabElement = function(id) {
    element = this.getTabById(id);
    return element.detach();
  }
  
  
  TabBar.prototype.getActiveTab = function() {
    return $('#tabBar .tab.active');
  }
  
  
  TabBar.prototype.setActiveTab = function(id) {
    this.getActiveTab().removeClass('active');
    
    element = this.getTabById(id);
    element.addClass('active');
    
    this.getTabBarElement().triggerHandler('ActiveTabChangeEvent', id);
    return element;
  }
  
  
  TabBar.prototype.getTabById = function(id) {
    return $('#tabBar .tab.' + id);
  }
  
  
  TabBar.prototype.exposeApi = function() {
    return {
      addTab : this.addTab.bind(this),
    }
  }


  return TabBar;

})();

  
})()