'use strict';

var expect = require('expect');
// Use node stream to test readable-stream inherits from it
var Stream = require('stream');

var isStream = require('../lib/isStream');

describe('isStream()', function() {

  it('returns true for a Stream', function(done) {
    var testStream = new Stream();
    var result = isStream(testStream);
    expect(result).toEqual(true);
    done();
  });

  it('returns false for a Buffer', function(done) {
    var testBuffer = new Buffer('test');
    var result = isStream(testBuffer);
    expect(result).toEqual(false);
    done();
  });

  it('returns false for null', function(done) {
    var result = isStream(null);
    expect(result).toEqual(false);
    done();
  });

  it('returns false for an array of numbers', function(done) {
    var testArray = [1, 2, 3];
    var result = isStream(testArray);
    expect(result).toEqual(false);
    done();
  });
});
