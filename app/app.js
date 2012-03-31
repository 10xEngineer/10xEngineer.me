var express = require('express');
var mongo = require('mongoskin');
var RedisStore = require('connect-redis')(express);
var sessionStore = new RedisStore();

var log4js = require('log4js');
log = log4js.getLogger('app');

// Prototype Utilities
require('./utils/prototypeUtils');

// Read configuration
var config = require('./helpers/config');

// ----------------
// Redis
// ----------------

var redis = require("redis");
var client = redis.createClient();

client.on("error", function (err) {
    log.error("[Redis] " + err);
});

// Authentication Middleware
var authMiddleware = require('./helpers/auth')(config.auth);

// ----------------
// Express
// ----------------
var app = module.exports = express.createServer();

// Express Middleware config
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    store: sessionStore,
    secret: 'shhhhhh',
    key: 'my.sid',
    cookie: {maxAge: 31557600000 }
  }));

  app.use(authMiddleware.middleware());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// Everyauth view helper
authMiddleware.helpExpress(app);

// Express environment config
app.configure('development', function(){
  app.use(log4js.connectLogger(log, { level: log4js.levels.INFO }));
  log.setLevel('TRACE');
});

app.configure('production', function(){
  log4js.addAppender(log4js.fileAppender('app.log'), 'app');
  log.setLevel('INFO');
});


// ----------------
// MongoDB Config
// ----------------
//var db = mongo.db(dbConfig.mongoDB + dbConfig.database_collection)
//postDb = db.collection('post');
//userDb = db.collection('user');
//courseDb = db.collection('course');
//categoryDb = db.collection('category');
var db = require('./helpers/database').db;


// Sample code to test database connection
// TODO: Remove it when not needed
getNextInt = function (type, callback) {
  db.collection('count').findAndModify({_id: type}, [['_id','asc']], {$inc: {count:1}}, {upsert:true,new:true}, function(error, result) { 
    if (error) {
      callback('Could not determine count for ' + type);
    }
    callback(null, result.count);
  });
};

getNextInt('saves', function(error, count) {
  if (error) {
    log.warn('Could not determine count');
  }
  log.info('Run ' + count + ' times.');
});

// Sample database queries
// TODO: Migrate to a separate file

loadCategories = function (req, res, next) {
  categoryDb.find().sort({name:1}).toArray(function(error, categories) {
    app.helpers({
      categories: categories 
    });
    next();
  });
}

loadPost = function (req, res, next) {
  postDb.findById(req.params.id, function(error, post) {
    if (error || !post) {
      log.trace('Could not find post!');
    }
    req.post = post;
    app.helpers({
      post: post 
    });
    next();
  });
}

loadCourse = function (req, res, next) {
  courseDb.findById(req.params.id, function(error, post) {
    if (error || !post) {
      log.trace('Could not find course!');
    }
    req.course = course;
    app.helpers({
      course: course 
    });
    next();
  });
}

// ----------------
// Routes
// ----------------

// Miscellaneous routes
app.get('/', function(req, res){
  res.render('main', {
    title: '10xEngineer.me Home', 
    coursenav: "N",
    Course: '',
    Unit: ''
  });
});

app.get('/about', function(req, res){
  res.render('default', {
    title: '10xEngineer.me About',
    coursenav: "N",
    text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
  });
});

app.get('/auth', function(req, res){
  res.render('users/login', {
    title: 'Log In',
    coursenav: "N",
    text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
  });
});


// Controllers
require('./controllers/course')(app);


// Startup
app.listen(3000);
log.info("Express server listening on port %d in %s mode", app.address().port, app.settings.env);



// TODO: Remove this useless code is not needed
// -----------------------------------------------------------------------
/*

var fs = require('fs');
var util = require('util');
var connect = require('connect');

var wsdlurl = 'http://ideone.com/api/1/service.json';
var code = "";
var ace = null;
var editor = null;

var Session = connect.middleware.session.Session,
    parseCookie = connect.utils.parseCookie

var io = require('socket.io').listen(app); 
io.set('log level', 0);

io.set('authorization', function (data, accept) {
  if (data.headers.cookie) {
    data.cookie = parseCookie(data.headers.cookie);
    data.sessionID = data.cookie['my.sid'];
    data.sessionStore = sessionStore;
    sessionStore.get(data.sessionID, function (err, session) {
      if (err) {
        accept(err.message, false);
      } else {
        data.session = new Session(data, session);
        accept(null, true);
      }
    });
  } else {
    return accept('No cookie transmitted.', false);
  }
});

app.get('/listen', loadGlobals, function(req, res){
  res.render('listen', {layout:false});
});

io.sockets.on('connection', function (socket) {
  var hs = socket.handshake; 
  hs.session.info = {IConnected:'And all I got was this lousy status message.'}
  if (hs.session.newPost) {
    newPost = hs.session.newPost;
    delete hs.session.newPost;
    socket.broadcast.emit('newPost', { title: newPost.title, _id: newPost._id });
  }
  hs.session.touch().save();
  socket.on('new post', function (data) {
    socket.broadcast.emit('newPost', { title: data });
  });

//  chatProvider.findAll(function(error, lines) {
//    for (var i in lines) {
//      message = lines[i].line;
//      var messageId = '';
//      if (hs.session.user && hs.session.user.is_admin) {
//        messageId = lines[i]._id;
//      }
//      socket.emit('repeat', { youSaid: message, messageId: messageId });
//    }
//  }); 
//  socket.on('user message', function (data) {
//    socket.broadcast.emit('repeat', { youSaid: data });
//    chatProvider.save({line: data}); 
//  });
});

*/


// -----------------------------------------------------------------------

