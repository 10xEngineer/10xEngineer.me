
require("ace/lib/fixoldbrowsers");
require("ace/config").init();
var env = {};

var dom = require("ace/lib/dom");
var net = require("ace/lib/net");

var event = require("ace/lib/event");
var theme = require("ace/theme/textmate");
var EditSession = require("ace/edit_session").EditSession;
var UndoManager = require("ace/undomanager").UndoManager;

var HashHandler = require("ace/keyboard/hash_handler").HashHandler;

var Renderer = require("ace/virtual_renderer").VirtualRenderer;
var AceEditor = require("ace/editor").Editor;
var MultiSelect = require("ace/multi_select").MultiSelect;

// workers do not work for file:
if (location.protocol == "file:")
  EditSession.prototype.$useWorker = false;

/************** modes ***********************/
var modes = [];
function getModeFromPath(path) {
  var mode = modesByName.text;
  for (var i = 0; i < modes.length; i++) {
    if (modes[i].supportsFile(path)) {
      mode = modes[i];
      break;
    }
  }
  return mode;
}

var Mode = function(name, desc, extensions) {
  this.name = name;
  this.desc = desc;
  this.mode = "ace/mode/" + name;
  this.extRe = new RegExp("^.*\\.(" + extensions + ")$", "g");
};

Mode.prototype.supportsFile = function(filename) {
  return filename.match(this.extRe);
};

var modesByName = {
  c9search:   ["C9Search"     , "c9search_results"],
  coffee:     ["CoffeeScript" , "coffee|^Cakefile"],
  coldfusion: ["ColdFusion"   , "cfm"],
  csharp:     ["C#"           , "cs"],
  css:        ["CSS"          , "css"],
  diff:       ["Diff"         , "diff|patch"],
  golang:     ["Go"           , "go"],
  groovy:     ["Groovy"       , "groovy"],
  haxe:       ["haXe"         , "hx"],
  html:       ["HTML"         , "htm|html|xhtml"],
  c_cpp:      ["C/C++"        , "c|cc|cpp|cxx|h|hh|hpp"],
  clojure:    ["Clojure"      , "clj"],
  java:       ["Java"         , "java"],
  javascript: ["JavaScript"   , "js"],
  json:       ["JSON"         , "json"],
  jsx:        ["JSX"          , "jsx"],
  latex:      ["LaTeX"        , "latex|tex|ltx|bib"],
  less:       ["LESS"         , "less"],
  liquid:     ["Liquid"       , "liquid"],
  lua:        ["Lua"          , "lua"],
  luapage:    ["LuaPage"      , "lp"], // http://keplerproject.github.com/cgilua/manual.html#templates
  markdown:   ["Markdown"     , "md|markdown"],
  ocaml:      ["OCaml"        , "ml|mli"],
  perl:       ["Perl"         , "pl|pm"],
  pgsql:      ["pgSQL"        , "pgsql"],
  php:        ["PHP"          , "php|phtml"],
  powershell: ["Powershell"   , "ps1"],
  python:     ["Python"       , "py"],
  ruby:       ["Ruby"         , "ru|gemspec|rake|rb"],
  scad:       ["OpenSCAD"     , "scad"],
  scala:      ["Scala"        , "scala"],
  scss:       ["SCSS"         , "scss|sass"],
  sh:         ["SH"           , "sh|bash|bat"],
  sql:        ["SQL"          , "sql"],
  svg:        ["SVG"          , "svg"],
  tcl:        ["Tcl"          , "tcl"],
  text:       ["Text"         , "txt"],
  textile:    ["Textile"      , "textile"],
  xml:        ["XML"          , "xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl"],
  xquery:     ["XQuery"       , "xq"],
  yaml:       ["YAML"         , "yaml"]
};

for (var name in modesByName) {
  var mode = modesByName[name];
  mode = new Mode(name, mode[0], mode[1]);
  modesByName[name] = mode;
  modes.push(mode);
}


if (window.require && window.require.s) try {
  for (var path in window.require.s.contexts._.loaded) {
    if (path.indexOf("!") != -1)
      path = path.split("!").pop();
    else
      path = path + ".js";
    ownSource[path] = "";
  }
} catch(e) {}


function Editor(options) {
  var self = this;
  this.options = options;
  this.tabs = {};
  this.blankSession = new EditSession('');

  var el = $(options.editor).get(0);

  // TODO: Dragdrop over editor window
  $(el).on('dragover', function(e) {
    return event.preventDefault(e);
  });

  $(el).on('drop', function(e) {
    // TODO: Implement
    return event.preventDefault(e);
  });

  // Initialize renderer
  var renderer = new Renderer(el);
  renderer.scrollBar.element.style.display = "none";
  renderer.scrollBar.width = 0;
  renderer.content.style.height = "auto";

  renderer.screenToTextCoordinates = function(x, y) {
    var pos = this.pixelToScreenCoordinates(x, y);
    return this.session.screenToDocumentPosition(
      Math.min(this.session.getScreenLength() - 1, Math.max(pos.row, 0)),
      Math.max(pos.column, 0)
    );
  };

  // todo size change event
  renderer.$computeLayerConfig = function() {
    var longestLine = this.$getLongestLine();
    var lastRow = this.session.getLength();
    var height = this.session.getScreenLength() * this.lineHeight;

    this.scrollTop = 0;
    var config = this.layerConfig;
    config.width = longestLine;
    config.padding = this.$padding;
    config.firstRow = 0;
    config.firstRowScreen = 0;
    config.lastRow = lastRow;
    config.lineHeight = this.lineHeight;
    config.characterWidth = this.characterWidth;
    config.minHeight = height;
    config.maxHeight = height;
    config.offset = 0;
    config.height = height;

    this.$gutterLayer.element.style.marginTop = 0 + "px";
    this.content.style.marginTop = 0 + "px";
    this.content.style.width = longestLine + 2 * this.$padding + "px";
    this.content.style.height = height + "px";
    this.scroller.style.height = height + "px";
    this.container.style.height = height + "px";
  };

  var ace = new AceEditor(renderer);
  new MultiSelect(ace);
  ace.setSession(this.blankSession);
  ace.setKeyboardHandler(null);
  ace.setAnimatedScroll(true);
  ace.setReadOnly(true);

  ace.commands.addCommand({
      name: "save",
      bindKey: {win: "Ctrl-S", mac: "Command-S"},
      exec: function(e) {
        self.saveFile();
      }
  });

  // Assign ace editor
  this.ace = ace;

  this.tabbar = views_tabbar_create();

  this.vfs = options.vfs;

  // TODO: fix
  var json = {};
  this.tree = new FileTree($(options.tree), json);

  // Create context menu
  $.contextMenu({
    selector: '.directory, .file',
    callback: function(key, options) {
      switch(key) {
        case 'newFile':
          self.tree.create(this, 'file');
          break;
        case 'newDir':
          self.tree.create(this, 'directory');
          break;
        case 'rename':
          self.tree.rename(this);
          break;
        case 'remove':
          self.tree.remove(this);
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


  // Bind events to fileTree
  this.tree.on('create', function(name, path, type) {
    if((type=='file')){
      self.vfs.newFile(name, path, function(err){
        console.log("Get Call back of file creation at VFS.");
        if(err){
          console.log("Error in "+type+" creation.");
        } else {
          console.log(type+" has been created successfully.");
        }
      });
    } else {
      self.vfs.newDir(name, path, function(err){
        if(err){
          console.log("Error in "+type+" creation.");
        }
        else{
          console.log(type+" has been created successfully.");
        }
      });
    }
  });

  this.tree.on('openTab', function(path){
    console.log("Testing of catch event"+path);
  });

  // RENAME EVENT
  this.tree.on('rename', function(newName, oldName){
    self.vfs.rename(newName, oldName, function(){
      console.log("Test Callback");
    });
  });

  // REMOVE EVENT
  this.tree.on('remove', function(path){
    console.log(path);
    if(/\/$/.test(path)){
      self.vfs.removeDir(path, function(error) {
        if(!error) {
          caller.remove();
        }
      });
    } else {
      self.vfs.removeFile(path, function(error) {
        if(!error) {
          caller.remove();
        }
      });
    }
  });

  this.tree.on('openFile', function(path) {
    self.openTab(path);
  });

  this.tree.on('openDir', function(path, element) {
    self.vfs.readDir(path, function(json){
      self.tree.expand(element, json);
    });
  });

  // Tabbar events
  this.tabbar.on('close', function(id) {
    self.closeTab(id);
  });

  this.tabbar.on('open', function(id) {
    self.openTab(id);
  });

  // Load the root directory
  this.vfs.readDir('/', function(json) {
    self.tree.refresh(json);
  });
}

Editor.prototype = new EventEmitter2({
  wildcard: true,
  delimiter: '::',
  maxListeners: 20
});


// Tab related functions

Editor.prototype.newTab = function(path) {
  var self = this;
  // TODO: Extract actual name
  var name = path;
  var doc = this.tabs[path] || {};

  //@todo do something while waiting
  // env.editor.setSession(emptySession || (emptySession = new EditSession("")))
  self.vfs.readFile(path, function(content) {
    var session = new EditSession(content);
    session.setUndoManager(new UndoManager());
    doc.session = session;
    doc.path = path;
    var mode = getModeFromPath(path);
    session.modeName = mode.name;
    session.setMode(mode.mode);
    session.on('change', function() {
      self.setTabState(self.active, 'dirty');
    });
    self.ace.setSession(session);
    self.ace.focus();
    self.ace.setReadOnly(false);

    // Save the open tab in memory
    self.tabs[path] = doc;

    var $tab = self.tabbar.addTab({
      id: path,
      title: name
    });

  });
};

Editor.prototype.openTab = function(path) {
  var self = this;
  // TODO: Extract actual name
  var doc = this.tabs[path] || {};

  this.active = path;
  if (doc.session) {
    self.ace.setSession(doc.session);
  } else {
    self.newTab(path);
  }
};

Editor.prototype.closeTab = function(path) {
  var self = this;
  this.active = null;
  self.ace.setReadOnly(true);
  self.ace.setSession(self.blankSession);
  delete self.tabs[path];
};

// File related functions
Editor.prototype.saveFile = function() {
  var self = this;
  if(!this.active) {
    return console.log('No active tabs');
  }
  this.setTabState(this.active, 'saving')
  
  var content = this.getContent();

  this.vfs.saveFile(this.active, content, function() {
    self.setTabState(self.active, 'clean');
    console.log('saved');
  });

  this.emit('saved');
  return false;
};

Editor.prototype.loadMode = function(value) {
  this.ace.getSession().setMode(modesByName[value].mode || modesByName.java.mode);
  this.ace.getSession().modeName = value;
};

Editor.prototype.getContent = function() {
  return this.ace.getSession().getValue();
};

var consoleHight = 20;
Editor.prototype.onResize = function() {
  var left = this.offsetLeft;
  var width = document.documentElement.clientWidth - left;
  container.style.width = width + "px";
  container.style.height = document.documentElement.clientHeight - consoleHight + "px";
  this.resize();
};

Editor.prototype.setTabState = function(id, state) {
  tab = this.tabbar.getTabElementById(id)
  switch (state) {
    case 'saving':
      tab.addClass('saving');
      break;
    case 'clean':
      tab.removeClass('saving');
      tab.removeClass('dirty');
      break;
    case 'dirty':
      tab.addClass('dirty');
  }
}