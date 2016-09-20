'use strict';

var expect = require('expect');

var cloneBuffer = require('../lib/cloneBuffer');

describe('cloneBuffer()', function() {

  it('returns a new Buffer reference', function(done) {
    var testBuffer = new Buffer('test');
    var testBuffer2 = cloneBuffer(testBuffer);

    expect(testBuffer2).toExist();
    expect(testBuffer2).toBeA(Buffer);
    expect(testBuffer2).toNotBe(testBuffer);
    done();
  });

  it('does not replicate modifications to the original Buffer', function(done) {
    var testBuffer = new Buffer('test');
    var testBuffer2 = cloneBuffer(testBuffer);

    // Test that changes dont modify both pointers
    testBuffer2.write('w');

    expect(testBuffer.toString('utf8')).toEqual('test');
    expect(testBuffer2.toString('utf8')).toEqual('west');
    done();
  });
});
