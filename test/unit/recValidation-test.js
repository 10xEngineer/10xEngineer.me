var mocha = require('mocha')
  , Context = mocha.Context
  , Suite = mocha.Suite
  , Test = mocha.Test;

var app = require('../../server.js');
var assert = require('assert')
  , validation = load.middleware('validation')  ;

describe('validation', function() {

  it('Validation fucntion should validate.', function(done) {
    assert.equal(null, validation(
    // entity object
    {
      title: "dkjfhgk",
      description: "dsfksdkfk",
      type: "video",
      videoType: "facebook",
      url: "sldjfljsdl"
    }, 
    // Config object
    {
      title : {required:true},
      description : {required: false},
      type : {
        required: true,
        checkFor:{
          video : {
            videoType : {
              required: true,
              checkFor: {
                upload:{
                  file : {required:true}
                },
                facebook:{
                  url: {required: true}
                }
              }
            }
          },
          programming: {
            language : {required:true},
            code: {required: true},
            input: {required: true},
            output: {required: true}
          }
        }
      }
    }));
    done();
  });
});