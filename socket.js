var express = require('express');
var redis = require('redis');
var parseCookie = require('connect').utils.parseCookie;
var Session = require('connect').middleware.session.Session;
var ConnectRedisStore = require('connect-redis')(express);

var RedisStore = require('socket.io/lib/stores/redis')
  , pub    = redis.createClient()
  , sub    = redis.createClient()
  , client = redis.createClient();


module.exports = function(app) {
  var io = module.exports = require('socket.io').listen(app);
  var sessionStore = new ConnectRedisStore();

  io.configure(function () {
    io.set('authorization', function(data, callback) {
      // check if there's a cookie header
      if (data.headers.cookie) {
          // if there is, parse the cookie
          //data.cookie = parseJSONCookies(parseCookie(data.headers.cookie));
          data.cookie = parseCookie(data.headers.cookie);
          // note that you will need to use the same key to grad the
          // session id, as you specified in the Express setup.
          data.sessionID = data.cookie['my.sid'];
          // save the session store to the data object 
          // (as required by the Session constructor)
          sessionStore.get(data.sessionID, function (err, session) {
            if (err) {
              callback(err, false);
            } else if(!session) {
              callback('Session not found');
            } else {
              // create a session object, passing data as request and our
              // just acquired session data
              data.session = new Session(data, session);
              callback(null, true);
            }
          });

      } else {
         // if there isn't, turn down the connection with a message
         // and leave the function.
         return callback('No cookie transmitted.', false);
      }
    });
  });

  io.set('store', new RedisStore({
    redisPub : pub,
    redisSub : sub,
    redisClient : client
  }));
  io.set('log level', 1);

  io.configure('development', function () {
    io.set('transports', ['websocket']);
  });

  io.configure('production', function () {
    io.set('transports', ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling', 'flashsocket']);
  });

  // Initialize socket events
  require('./socket/lesson')(io);
  require('./socket/labs')(io);
};



