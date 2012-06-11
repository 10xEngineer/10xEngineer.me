var mocha = require('mocha')
  , Context = mocha.Context
  , Suite = mocha.Suite
  , Test = mocha.Test;

var assert = require('assert')
  , validation = require('../app/helpers/validation');

describe('validation', function() {

  it('Validation fucntion should validate email.', function(done) {
    assert.equal(true, validation['email']('allinhtml@gmail.com','true'));
    done();
  });

  it('validation function shold check required.', function(done){
  	assert.equal(true, validation['required']('titleName','true'));
  	done();
  });

  it('validation function shold check regular expression.', function(done){
  	assert.equal(true, validation['regexp']('titleName',new RegExp(/[a-zA-z]+/)));
  	done();
  });

  it('validation function shold check number.', function(done){
  	assert.equal(true, validation['required']('1234567890','true'));
  	done();
  });

});