var mocha = require('mocha')
  , Context = mocha.Context
  , Suite = mocha.Suite
  , Test = mocha.Test;

var assert = require('assert');

var request = require('request');

var wsdlUrl = 'http://ideone.com/api/1/service.json';
var link;

describe('IDEONE', function() {

/*
  it('should get available languages', function(done) {
    this.timeout(50000);
    request({
      method: 'GET',
      uri: wsdlUrl,
      json: {
        jsonrpc: "2.0",
        method: "getLanguages",
        params: {
          user: "velniukas",
          pass: "limehouse"
        }, 
        "id": 1
      }
    },
    function (error, response, body) {
      console.log(body);
      done();
    });
  });


  it('should compile simple javascript', function(done) {
    this.timeout(5000);
    request({
      method: 'GET',
      uri: wsdlUrl,
      json: {
        jsonrpc: "2.0",
        method: "createSubmission",
        params: {
          user: "velniukas",
          pass: "limehouse",
          sourceCode: "while(input = readline()) { print(main(input)); } function main(arg) { arg += 'test'; return arg; }",
          language: 112, //javascript
          input:"1\n2\n3", //this is a parameter bug of the ideone API, it supposes to be a run time input, instead of an indicator to run code
          run:true
        }, 
        "id": 1
      }
    },
    function (error, response, body) {
      link = body.result.link;
      assert.equal(body.result.error, 'OK');
      done();
    });
  });

  it('should fetch the compilation status', function(done) {
    this.timeout(5000);
    request({
      method: 'GET',
      uri: wsdlUrl,
      json: {
        jsonrpc: "2.0",
        method: "getSubmissionStatus",
        params: {
          user: "velniukas",
          pass: "limehouse",
          link: link
        }, 
        "id": 1
      }
    },
    function(error, response, body) {
      link = body.result.link;
      console.log(body);
      //assert.equal(body.result.error, 'OK');
      done();
    });
  });
*/
});