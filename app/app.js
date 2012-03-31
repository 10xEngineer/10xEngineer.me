var express = require('express');
var mongo = require('mongoskin');
var RedisStore = require('connect-redis')(express);
var sessionStore = new RedisStore();

var log4js = require('log4js');
log = log4js.getLogger('app');
var path = require('path');

// Prototype Utilities
require('./utils/prototypeUtils');

// Read configuration
// TODO: transform it to something better
var siteConfig, codeConfig, dbConfig;
if (path.existsSync('./configLocal.js')) {
  var config = require('./configLocal.js');
  mail = require('mail').Mail(
    config.getMailConfig()
  );
  siteConfig = config.getSiteConfig();
  codeConfig = config.getCodeConfig();
  dbConfig = config.getDBConfig();

  log.info(siteConfig);
  log.info(codeConfig);
  log.info(dbConfig);

}
else {
  log.error('Please copy configDefault.js to configLocal.js and replace applicable values.');
}

// ----------------
// Redis
// ----------------

var redis = require("redis");
var client = redis.createClient();

client.on("error", function (err) {
    log.error("[Redis] " + err);
});


// ----------------
// Express
// ----------------
var app = module.exports = express.createServer();

// Express Middleware config
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.use(express.bodyParser({uploadDir:'./upload'});
  app.use(express.cookieParser());
  app.use(express.session({
    store: sessionStore,
    secret: 'shhhhhh',
    key: 'my.sid',
    cookie: {maxAge: 31557600000 }
  }));

  // To include underscore etc inside Jade templates - add them here
  //app.helpers({
  //  _: require("underscore")
  //});

  app.use(express.methodOverride());
  //app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

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
var db = mongo.db(dbConfig.mongoDB + dbConfig.database_collection)
postDb = db.collection('post');
userDb = db.collection('user');
courseDb = db.collection('course');
categoryDb = db.collection('category');


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
app.get('/', loadGlobals, function(req, res){
  res.render('main', {
    title: '10xEngineer.me Home', 
  loggedInUser:req.user, 
  coursenav: "N",
  Course: '',
  Unit: ''
  });
});

app.get('/about', loadGlobals, function(req, res){
  res.render('default', {
    title: '10xEngineer.me About',
    loggedInUser:req.user,
  coursenav: "N",
    text: '10xEngineer.me - Creating the next generation of expert developers and engineers.'
  });
});

// Courses-related routes
app.get('/coursesold', loadGlobals, function(req, res){
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
  contentfile: req.param('coursefile', ''),
  loggedInUser: req.user
  });
});

app.post('/file-upload', loadGlobals, function(req, res, next) {
  console.log('Uploading file');
  req.form.complete( function(err, fields, files) {
    if (err) {
      next(err);
    } else {
      console.log('Uploaded %s to %s', files.course.filename, files.course.path);
      console.log('copying file from temp upload dir to course dir');
      var tmp_path = files.course.path;
      var target_path = './public/courses/' + files.course.name;
      fs.rename(tmp_path, target_path, function(err) {
        if(err) throw err;
        // delete the temporary file
        fs.unlink(tmp_path, function() {
          if(err) throw err;
          console.log('File uploaded to: '+target_path + ' - ' + files.course.size + ' bytes');
          res.redirect('/contentmanager', {coursefile: target_path+'/'+files.course.name});
        });
      });     
    }
  });
  
  req.form.on('progress', function(bytesReceived, bytesExpected) {
    var percent = (bytesReceived / bytesExpected * 100) | 0;
    process.stdout.write('Uploading: %' + percent + '\r');
  })

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
  request(
    { method: 'GET'
    , uri: wsdlurl
    , multipart: 
      [ { 'Content-type': 'application/json'
        ,  body: JSON.stringify({"jsonrpc": "2.0", "method": "getLanguages", "params": {"user": "velniukas", "pass": "limehouse"}, "id": 1})
        }
      ] 
    }
  , function (error, response, body) {
      if(response.statusCode == 201){
        console.log('test function called successfully: ' + error +', ' + moreHelp + ', ' + pi + ', ' + answerToLifeAndEverything + ', ' + oOok);
    return response.statusCode, response.body;
      } else {
        console.log('error: '+ response.statusCode)
        console.log(body);
    return response.statusCode, response.body;
      }
    }
  )
  
}

// Controllers
require('./controllers/course')(app);



// TODO: Remove this useless code is not needed
// -----------------------------------------------------------------------
/*

var request = require('request');
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



app.listen(3000);
log.info("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
