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
  app.use(express.bodyParser({uploadDir: __dirname + '/upload', keepExtensions: true }));
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

// Sample code to test database connection
// TODO: Remove it when not needed
var count = require('./models/count');
count.getNext('saves', function(error, count) {
  if (error) {
    log.warn('Could not determine count');
  }
  log.info('Run ' + count + ' times.');
});


// Custom middleware
requireLogin = function (req, res, next) {
  if(!req.loggedIn) {
    log.debug('User not logged in, redirecting to /auth.');
    res.redirect('/auth');
  }
}

requireAdmin = function (req, res, next) {
  // TODO: Implement with backend integration
  if(req.loggedIn) req.user.role = 'admin';

  if(!req.loggedIn || !req.user.role === 'admin') {
    log.debug('User not logged in, redirecting to /auth.');
    res.redirect('/auth');
  }
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

//socket for ideone source code execution
var request = require('request');
var wsdlurl = 'http://ideone.com/api/1/service.json';
var io = require('socket.io').listen(app);
io.set('log level', 0);
io.sockets.on('connection', function (socket) {
  // var hs = socket.handshake; 
  //   hs.session.info = {IConnected:'And all I got was this lousy status message.'}
  //   if (hs.session.newPost) {
  //     newPost = hs.session.newPost;
  //     delete hs.session.newPost;
  //     socket.broadcast.emit('newPost', { title: newPost.title, _id: newPost._id });
  //   }
  //   hs.session.touch().save();
  //   socket.on('new post', function (data) {
  //     socket.broadcast.emit('newPost', { title: data });
  //   });    

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
  	socket.on('submitcode', function(data){
		console.log(data);
		request(
		    { method: 'GET'
		    , uri: wsdlurl
			, json: {
						jsonrpc: "2.0",
						method: "createSubmission", 
						params: 
						{
							user: "velniukas", 
							pass: "limehouse", 
							sourceCode: data.source,
							language: data.language, //javascript
							input:true, //this is a parameter bug of the ideone API, it supposes to be a run time input, instead of an indicator to run code
							run:true
						}, 
						"id": 1
					}
		    }
		  , function (error, response, body) {
				console.log(body);
		      	socket.emit('codesent', body);
		    }
		  )
	});
	
	socket.on('getSubmissionStatus', function(data){
		request(
				{
					method:'GET',
					uri: wsdlurl,
					json:{
						jsonrpc: "2.0",
						method: "getSubmissionStatus", 
						params: 
						{
							user: "velniukas", 
							pass: "limehouse",
							link: data.linkCode, 
						}, 
						"id": 1
					}
				},
				function(error, response, body){
					console.log(body);
					socket.emit('submissionStatus', body)           
				}
				)
	});
	
	socket.on('getSubmissionDetails', function(data){
		request(
			{
				method:'GET',
				uri: wsdlurl,
				json:{
					jsonrpc: "2.0",
					method: "getSubmissionDetails", 
					params: 
					{
						user: "10xengineer", 
						pass: "secret",
						link: data.linkCode, 
						withSource: true,
						withOutput: true,
						withCmpinfo: true,
						withStderr: true
					}, 
					"id": 1
				}
			},
			function(error, response, body){
				console.log(body);
				socket.emit('submissionDetails', body)           
			}
		)
	}); 
});
