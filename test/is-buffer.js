'use strict';

var expect = require('expect');
var Stream = require('readable-stream');

var isBuffer = require('../lib/isBuffer');

describe('isBuffer()', function() {

  it('returns true for a Buffer', function(done) {
    var testBuffer = new Buffer('test');
    var result = isBuffer(testBuffer);
    expect(result).toEqual(true);
    done();
  });

  it('returns false for a Stream', function(done) {
    var testStream = new Stream();
    var result = isBuffer(testStream);
    expect(result).toEqual(false);
    done();
  });

  it('returns false for a null', function(done) {
    var result = isBuffer(null);
    expect(result).toEqual(false);
    done();
  });

  it('returns false for a array of numbers', function(done) {
    var testArray = [1, 2, 3];
    var result = isBuffer(testArray);
    expect(result).toEqual(false);
    done();
  });
});
