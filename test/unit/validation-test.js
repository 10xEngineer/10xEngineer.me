var mocha = require('mocha')
  , Context = mocha.Context
  , Suite = mocha.Suite
  , Test = mocha.Test;

var app = require('../../server.js');
var assert = require('assert')
  , validation = load.helper('validation');

describe('Validation', function() {

  describe('required', function() {
    it('should allow string', function(done){
      var response = validation.required()
      assert.equal(true, validation.required('titleName'));
      done();
    });
    it('should not allow undefined', function(done){
      var response = validation.required()
      assert.equal("is required", validation.required(undefined));
      done();
    });
    it('should not allow blank string', function(done){
      var response = validation.required()
      assert.equal("is required", validation.required(''));
      done();
    });
    it('should not allow spaces', function(done){
      var response = validation.required()
      assert.equal("is required", validation.required('   '));
      done();
    });
    it('should not allow tabs', function(done){
      var response = validation.required()
      assert.equal("is required", validation.required('			'));
      done();
    });
  });

  describe('regex', function() {
    it('should allow alphabetial string', function(done){
      assert.equal(true, validation.regexp('titleName',new RegExp(/[a-zA-z]+/)));
      done();
    });
    it('should not allow alphanumerical string', function(done){
      assert.equal('is invalid', validation.regexp('titleName123',new RegExp(/[a-zA-z]+/)));
      done();
    });
  });
  describe('email', function() {
    it('should allow valid email', function(done) {
      assert.equal(true, validation.email('allinhtml@gmail.com'));
      assert.equal(true, validation.email('all.inhtml@gmail.com'));
      assert.equal(true, validation.email('all+inhtml@gmail.com'));
      assert.equal(true, validation.email('all_inhtml@gmail.com'));
      assert.equal(true, validation.email('allinhtml@gmail.com.com'));
      done();
    });
    it('should not allow invalid email', function(done) {
      assert.equal('is an invalid email', validation.email('all@inhtml@gmail.com'));
      assert.equal('is an invalid email', validation.email('allinhtml@gmail'));
      done();
    });
  });

  describe('number', function() {
    it('should allow valid number', function(done){
      assert.equal(true, validation.number('1234567890'));
      assert.equal(true, validation.number('123.456'));
      done();
    });
    it('should not allow invalid number', function(done){
      assert.equal('is an invalid number', validation.number(''));
      assert.equal('is an invalid number', validation.number('123.456.7890'));
      assert.equal('is an invalid number', validation.number('abc'));
      assert.equal('is an invalid number', validation.number('12abc'));
      done();
    });
  })
});