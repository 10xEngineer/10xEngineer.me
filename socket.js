var express = require('express');
var parseCookie = require('connect').utils.parseCookie;
var Session = require('connect').middleware.session.Session;
var RedisStore = require('connect-redis')(express);


module.exports = function(app) {
  var io = module.exports = require('socket.io').listen(app);
  var sessionStore = new RedisStore();

  io.configure(function () {
    io.set('transports', ['websocket', 'flashsocket']);
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
          data.sessionStore = sessionStore;
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

  io.configure('development', function () {
    io.set('transports', ['websocket']);
    //io.enable('log');
  });

  // Initialize socket events
  require('./socket/lesson')(io);
};



