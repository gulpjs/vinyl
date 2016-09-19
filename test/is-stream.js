var isStream = require('../lib/isStream');
// Use node stream to test readable-stream inherits from it
var Stream = require('stream');
require('should');
require('mocha');

describe('isStream()', function() {
  it('should return true on a Stream', function(done) {
    var testStream = new Stream();
    isStream(testStream).should.equal(true);
    done();
  });

  it('should return false on a Buffer', function(done) {
    var testBuffer = new Buffer('test');
    isStream(testBuffer).should.equal(false);
    done();
  });

  it('should return false on a null', function(done) {
    isStream(null).should.equal(false);
    done();
  });

  it('should return false on a array of numbers', function(done) {
    var testArray = [1, 2, 3];
    isStream(testArray).should.equal(false);
    done();
  });
});
