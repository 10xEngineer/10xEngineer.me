var app = require('../app')(require('../app/config/config'));
var request = require('./support/http');

describe('Home Page', function(){
	it('should load the home page', function(done) {

		request(app)
		.get('/')
		.expect(200)
		.expect('Content-Type', 'text/html')
		.end(done);
	});
});
