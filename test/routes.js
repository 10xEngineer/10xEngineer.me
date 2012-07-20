var app = require('../app')(require('../app/config/config'));
var request = require('./support/http');

// Override log
global.log = { info: function(){}, error: function(){}, warn: function(){}, silly: function(){} };

describe('Route collection', function() {
  describe('main', function(){
    it('should load the route /', function(done) {

      request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(done);
    });
    it('should load the route /about', function(done) {

      request(app)
      .get('/about')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(done);
    });
    it('should load the route /auth', function(done) {

      request(app)
      .get('/auth')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(done);
    });
  });
})
