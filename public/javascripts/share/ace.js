(function() {
  var Range = require("ace/range").Range;

  var applyToShareJS = function(editorDoc, delta, doc) {
    var text;
    getStartOffsetPosition = function(range) {
      var lines = editorDoc.getLines(0, range.start.row);
      var offset = 0;
      var i, _i, _len;
      for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
        var line = lines[i];
        offset += i < range.start.row ? line.length : range.start.column;
      }
      return offset + range.start.row;
    };
    var pos = getStartOffsetPosition(delta.range);
    switch (delta.action) {
      case 'insertText':
        doc.insert(pos, delta.text);
        break;
      case 'removeText':
        doc.del(pos, delta.text.length);
        break;
      case 'insertLines':
        text = delta.lines.join('\n') + '\n';
        doc.insert(pos, text);
        break;
      case 'removeLines':
        text = delta.lines.join('\n') + '\n';
        doc.del(pos, text.length);
        break;
      default:
        throw new Error("unknown action: " + delta.action);
    }
  };

  window.sharejs.extendDoc('attach_editor', function(editor, keepEditorContents) {
    /*
     * Format:
     * {
     *   tree: {} # Grid object
     *   tabs: {} # Tabs object
     *   currentDoc: {} # Currently displayed ace document
     * }
     */
  
    if (!this.provides['json']) {
      throw new Error('Only json documents can be attached to editor');
    }

    var doc = this;

    // Initialize
    if(!doc.created) {
      doc.submitOp([{p:[],od:null,oi:{
        tree: {},
        tabs: {
          tabs: [],
          current: ""
        },
        currentDoc: ""
      }}]);
    }

    // Events for tree
    var treeDoc = doc.at('tree');
    treeDoc.on('insert', function(position, data) {
      // TODO: Handle file/dir creation
    });
    treeDoc.on('delete', function(position, data) {
      // TODO: Handle file/dir removal
    });


    // Events for tabs
    var tabDoc = doc.at('tabs');
    var syncTabs = tabDoc.at('tabs');
    var syncActiveTab = tabDoc.at('active');
    var currentTabs = editor.tabbar;
    currentTabs.on('new', function(id) {
      syncTabs.push(id);
    });
    currentTabs.on('open', function(id) {
      syncActiveTab.set(id);
    });
    currentTabs.on('close', function(id) {
      var tabs = syncTabs.get();
      tabs.splice(tabs.indexOf(id), 1);
      syncTabs.set(tabs);
    });
    syncTabs.on('insert', function(position, data) {
      console.log(data);
      editor.openTab(data);
    });
    syncTabs.on('delete', function(position, data) {
      editor.closeTab(data);
    });
    doc.on('change', function(op) {
      console.log(op);
    });


    // Events for currentDoc
    var currentDoc = doc.at('currentDoc');
    var aceEditor = editor.ace;
    var editorDoc = aceEditor.getSession().getDocument();
    editorDoc.setNewLineMode('unix');

    var check = function() {
      return window.setTimeout(function() {
        var editorText = editorDoc.getValue();
        var otText = currentDoc.getText();
        if (editorText !== otText) {
          console.error("Text does not match!");
          console.error("editor: " + editorText);
          return console.error("ot:     " + otText);
        }
      }, 0);
    };
    if (keepEditorContents) {
      currentDoc.del(0, currentDoc.getText().length);
      currentDoc.insert(0, editorDoc.getValue());
    } else {
      editorDoc.setValue(currentDoc.getText());
    }
    check();
    var suppress = false;
    var editorListener = function(change) {
      if (suppress) {
        return;
      }
      applyToShareJS(editorDoc, change.data, currentDoc);
      return check();
    };
    editorDoc.on('change', editorListener);
    var docListener = function(op) {
      suppress = true;
      applyToDoc(editorDoc, op);
      suppress = false;
      return check();
    };
    var offsetToPos = function(offset) {
      var line, lines, row, _i, _len;
      lines = editorDoc.getAllLines();
      row = 0;
      for (row = _i = 0, _len = lines.length; _i < _len; row = ++_i) {
        line = lines[row];
        if (offset <= line.length) {
          break;
        }
        offset -= lines[row].length + 1;
      }
      return {
        row: row,
        column: offset
      };
    };
    currentDoc.on('insert', function(pos, text) {
      suppress = true;
      editorDoc.insert(offsetToPos(pos), text);
      suppress = false;
      return check();
    });
    currentDoc.on('delete', function(pos, text) {
      var range;
      suppress = true;
      range = Range.fromPoints(offsetToPos(pos), offsetToPos(pos + text.length));
      editorDoc.remove(range);
      suppress = false;
      return check();
    });
    currentDoc.detach_ace = function() {
      doc.removeListener('remoteop', docListener);
      editorDoc.removeListener('change', editorListener);
      return delete doc.detach_ace;
    };
  });

}).call(this);
