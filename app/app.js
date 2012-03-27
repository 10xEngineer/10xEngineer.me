var express = require('express');
var mongo = require('mongoskin');
var qs = require('querystring');

var PostHelper = require('./lib/post.js');
var UserHelper = require('./lib/user.js');
var AdminHelper = require('./lib/admin.js');
var connect = require('express/node_modules/connect');
var RedisStore = require('connect-redis')(express);
var sessionStore = new RedisStore();
var redis = require("redis");
var client = redis.createClient();

var wsdlurl = 'http://ideone.com/api/1/service.json';
var code = "";
var ace = null;
var editor = null;
var log4js = require('log4js');
log = log4js.getLogger('app');
var path = require('path');
if (path.existsSync('./configLocal.js')) {
  var config = require('./configLocal.js');
  mail = require('mail').Mail(
    config.getMailConfig()
  );
  siteInfo = config.getSiteConfig();
  codeConfig = config.getCodeConfig();
}
else {
  log.error('Please copy configDefault.js to configLocal.js and replace applicable values.');
}

console.log(siteInfo);

var Session = connect.middleware.session.Session,
    parseCookie = connect.utils.parseCookie

client.on("error", function (err) {
    console.log("Error " + err);
});

var app = module.exports = express.createServer();
var io = require('socket.io').listen(app); 
io.set('log level', 0);
app.use(express.bodyParser());

// = Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    store: sessionStore,
    secret: 'shhhhhh',
    key: 'my.sid',
    cookie: {maxAge: 31557600000 }
  }));
  app.use(express.methodOverride());
//  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(log4js.connectLogger(log, { level: log4js.levels.INFO }));
  log.setLevel('TRACE');
});

app.configure('production', function(){
  log4js.addAppender(log4js.fileAppender('app.log'), 'app');
  log.setLevel('INFO');
});

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

Array.prototype.unique = function() {
  var o = {}, i, l = this.length, r = [];
  for(i=0; i<l;i+=1) o[this[i]] = this[i];
  for(i in o) {
    if (o[i]) {
      r.push(o[i]);
    }
  }
  return r;
};

String.prototype.randomString = function(stringLength) {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  if (!stringLength>0) {
    var stringLength = 8;
  }
  var randomString = '';
  for (var i=0; i<stringLength; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomString += chars.substring(rnum,rnum+1);
  }
  return randomString; 
}

// connect to the db and make the collections available globally
var db = mongo.db('localhost:27017/' + siteInfo.database_collection)
postDb = db.collection('post');
userDb = db.collection('user');
categoryDb = db.collection('category');
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

loadLastFivePosts = function (req, res, next) {
  postDb.find({requires_verification: { $ne: true }}).sort({created_at:-1}).limit(5).toArray(function(error, posts) { 
    app.helpers({
      lastFivePosts: posts
    });
    next();
  });
}

loadSessionUser = function (req, res, next) {
  if (req.session.user && req.cookies.rememberme) {
    req.user = req.session.user;
  }
  else {
    req.user = {};
  }
  if (req.user.is_root) {
    req.is_admin = true;
  }
  app.helpers({
    loggedInUser: req.user
  });
  next();
}

loadGlobals = [loadSessionUser, loadLastFivePosts];

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


// Routes
app.get('/', loadGlobals, function(req, res){
  res.render('main', {
    title: '10xEngineer.me Home', 
	loggedInUser:req.user, 
	coursenav: "N",
	Course: '',
	Unit: ''
  });
});

app.get('/courses', loadGlobals, function(req, res){
  res.render('overview', {
    title: '10xEngineer.me Course List', 
	loggedInUser:req.user, 
	coursenav: "N",
	Course: '',
	Unit: ''
  });
});

app.get('/course', loadGlobals, function(req, res){
  res.render('course', {
    title: '10xEngineer.me Course',
 	Course: 'CS99',
	Unit: 'Devops', 
	coursenav: "Y",
	loggedInUser:req.user
  });
});

app.get('/program', loadGlobals, function(req, res){
  res.render('ide', {
    title: '10xEngineer.me Course',
	Course: 'CS99',
	Unit: 'Devops',
	coursenav: "Y",
	loggedInUser:req.user,
	code: '',
	compile_results: '',
	compile_errors: ''
  });
});

app.get('/progress', loadGlobals, function(req, res){
  res.render('progress', {
    title: '10xEngineer.me Course', 
	Course: 'CS99',
	Unit: 'Devops', 
	coursenav: "Y",
	loggedInUser: req.user
  });
});

app.get('/contentmanager', loadGlobals, function(req, res){
  res.render('content_manager', {
    title: '10xEngineer.me Course Creator', 
	Course: '',
	Unit: '', 
	coursenav: "N",
	loggedInUser: req.user
  });
});

app.post('/submitCode', loadGlobals, function(req, res, next){
  console.log('in app.js::submitCode');

  var source = req.param('sourcecode', '');
  console.log('source=',source);
  var compile_res, compile_err = submitCode(source);
  console.log('re-rendering ide');
  res.render('ide', {
    title: 'submitCode',
	Course: req.param('Course', ''),
	Unit: req.param('Unit', '(unknown)'),
	coursenav: "Y",
    code: source, 
    compile_results: compile_res,
	compile_errors: compile_err,
    loggedInUser: req.user
  });

});

// IDEONE documentation http://ideone.com/files/ideone-api.pdf
submitCode = function(code) {
	var rpc = require('dnode');
	if( !rpc ) {
		console.log('ERROR: rpc not defined');
		return null, null;
	}
	dnode.connect(80, wsdlurl),
		showNotification = function(notif) {
			alert(notif.message);
			return notif.error, notif.message;
		};
	socket.listenRPC('testFunction', function(params) {
		if(params.error) {
			alert('testFunction error: '+params.error);
			return params.error, params.message;
		}
	}).listenRPC('notification', showNotification);

	return null, null;
}

app.get('/about', loadGlobals, function(req, res){
  res.render('default', {
    title: '10xEngineer.me About',
    loggedInUser:req.user,
	coursenav: "N",
    text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
  });
});

PostHelper.add_routes(app);
UserHelper.add_routes(app);
AdminHelper.add_routes(app, express);

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

app.listen(3000);
log.info("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
