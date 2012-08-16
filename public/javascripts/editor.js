
define('editor', function(require, exports, module) {

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
var Editor = require("ace/editor").Editor;
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
};

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
    mode = new Mode(name, mode[0], mode[1])
    modesByName[name] = mode;
    modes.push(mode);
}


/*********** demo documents ***************************/
var fileCache = {};

function initDoc(file, path, doc) {
    if (doc.prepare)
        file = doc.prepare(file);

    var session = new EditSession(file);
    session.setUndoManager(new UndoManager());
    doc.session = session;
    doc.path = path;
    if (doc.wrapped) {
        session.setUseWrapMode(true);
        session.setWrapLimitRange(80, 80);
    }
    var mode = getModeFromPath(path)
    session.modeName = mode.name;
    session.setMode(mode.mode);
}


if (window.require && window.require.s) try {
    for (var path in window.require.s.contexts._.loaded) {
        if (path.indexOf("!") != -1)
            path = path.split("!").pop();
        else
            path = path + ".js";
        ownSource[path] = ""
    }
} catch(e) {}


/*********** create editor ***************************/
var container = document.getElementById("editor");

// Splitting.
env.editor = newEditor(container);
window.env = env;
window.ace = env.editor;
env.editor.setAnimatedScroll(true);



/*********** manage layout ***************************/
var consoleHight = 20;
function onResize() {
    var left = env.editor.offsetLeft;
    var width = document.documentElement.clientWidth - left;
    container.style.width = width + "px";
    container.style.height = document.documentElement.clientHeight - consoleHight + "px";
    env.editor.resize();
}

window.onresize = onResize;
onResize();

/*********** options pane ***************************/

function loadMode(value) {
    env.editor.getSession().setMode(modesByName[value].mode || modesByName.text.mode);
    env.editor.getSession().modeName = value;
}

function loadContent(name) {
    var doc = fileCache[name];
    if (!doc)
        return;

    if (doc.session)
        return setSession(doc.session)

    //@todo do something while waiting
    // env.editor.setSession(emptySession || (emptySession = new EditSession("")))
    var path = doc.path;
    var parts = path.split("/");
    if (parts[0] == "docs")
        path = "demo/kitchen-sink/" + path;
    else if (parts[0] == "ace")
        path = "lib/" + path;

    net.get(path, function(x) {
        initDoc(x, path, doc);
        setSession(doc.session)
    })

    function setSession(session) {
        var session = env.split.setSession(session);
        updateUIEditorOptions();
        env.editor.focus();
    }
}


/************** dragover ***************************/
event.addListener(container, "dragover", function(e) {
    return event.preventDefault(e);
});

event.addListener(container, "drop", function(e) {
    var file;
    try {
        file = e.dataTransfer.files[0];
        if (window.FileReader) {
            var reader = new FileReader();
            reader.onload = function() {
                var mode = getModeFromPath(file.name);

                env.editor.session.doc.setValue(reader.result);
                modeEl.value = mode.name;
                env.editor.session.setMode(mode.mode);
                env.editor.session.modeName = mode.name;
            };
            reader.readAsText(file);
        }
        return event.preventDefault(e);
    } catch(err) {
        return event.stopEvent(e);
    }
});


function newEditor(el) {
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
        config.firstRow = 1;
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

    var editor = new Editor(renderer);
    new MultiSelect(editor);
    editor.session.setUndoManager(new UndoManager());

    return editor;
};


});