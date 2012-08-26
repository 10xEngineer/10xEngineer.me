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
    this.state = {tabs : []};
    
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
  
  
  TabBar.prototype.triggerTabBarEvent = function() {
    this.getTabBarElement().triggerHandler.apply(null, arguments);
  }
  
  
  TabBar.prototype.addTab = function(tab) {
    var id = tab.id,
      title = tab.title;
    this.state.tabs.push(tab)
    var tabElement = this.createTabElement(id, title);
    this.appendTabElement(tabElement);
    this.triggerTabBarEvent('TabAddedEvent', id);
    this.setActiveTab(id);
  };
  
  
  TabBar.prototype.removeTab = function(id) {
    if (this.state.activeTab === id) {
      this.setActiveTab(this.getNextActiveTab());
    }
    element = this.removeTabElement(id);
    this.triggerTabBarEvent('TabRemovedEvent', id);
    this.destroyTabElement(element);
    this.state.tabs.splice(this.getTabIndexById(id), 1);
  }
  
  
  TabBar.prototype.createTabElement = function(id, title) {
    var _self = this;
    return element = $('<div/>', {
      'class' : 'tab',
      text    : title
    })
    .append($('<a/>', {
      'class' : 'close_button',
      text    : 'x'
    })
      .click(function(event) {
        _self.removeTab(id);
        return event.stopPropagation();
      })
    )
    .click(function() {
      _self.setActiveTab(id);
    });
  }
  
  
  TabBar.prototype.destroyTabElement = function(element) {
    return element.remove();
  }
  
  
  TabBar.prototype.appendTabElement = function(element, index) {
    if (index) {
      previousElement = $('#tabBar .tab').eq(index);
      assert(previousElement.length !== 0, 'Recorded and actual state should have matched wherever this.state was modified');
      return previousElement.after(element);
    }
    else {
      return $('#tabBar').append(element);
    }
  }
  
  
  TabBar.prototype.removeTabElement = function(id) {
    var element = this.getTabElementById(id);
    return element.detach();
  }
  
  
  TabBar.prototype.getState = function() {
    return this.state;
  }
  
  
  TabBar.prototype.getNextActiveTab = function() {
    var currentState = this.getState(),
      currentTabs = currentState.tabs,
      currentTabId = currentState.activeTab,
      currentIndex = this.getTabIndexById(currentTabId);
    
    if (currentIndex > 0) {
      var nextActiveIndex = currentIndex - 1;
    }
    else {
      var nextActiveIndex = 0;
    }
    var nextActiveTab = currentTabs[nextActiveIndex];
    return nextActiveTab.id
  }
  
  
  TabBar.prototype.getActiveTabElement = function() {
    return this.getTabElementById(this.state.activeTab);
  }
  
  
  TabBar.prototype.setActiveTab = function(id) {
    this.getActiveTabElement().removeClass('active');
    
    element = this.getTabElementById(id);
    element.addClass('active');
    
    this.state.activeTab = id;
    
    this.triggerTabBarEvent('ActiveTabChangeEvent', id);
    return element;
  }
  
  
  TabBar.prototype.getTabIndexById = function(id) {
    var tab, tabIndex, _i, _len,
      tabs = this.state.tabs;

    for (tabIndex = _i = 0, _len = tabs.length; _i < _len; tabIndex = ++_i) {
      tab = tabs[tabIndex];
      if (tab.id === id) {
        break;
      }
    }
    return tabIndex;
  }
  
  
  TabBar.prototype.getTabElementById = function(id) {
    return $('#tabBar .tab').eq(this.getTabIndexById(id));
  }
  
  
  TabBar.prototype.exposeApi = function() {
    return {
      addTab : this.addTab.bind(this),
    }
  }


  return TabBar;

})();

  
})()