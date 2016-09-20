'use strict';

var expect = require('expect');

var stripTrailingSep = require('../lib/stripTrailingSep');

describe('stripTrailingSep()', function() {

  it('strips trailing separator', function(done) {
    expect(stripTrailingSep('foo/')).toEqual('foo');
    expect(stripTrailingSep('foo\\')).toEqual('foo');
    done();
  });

  it('does not strip when separator is only char in the string', function(done) {
    expect(stripTrailingSep('/')).toEqual('/');
    expect(stripTrailingSep('\\')).toEqual('\\');
    done();
  });

  it('strips only the trailing separator', function(done) {
    expect(stripTrailingSep('/test/foo/bar/')).toEqual('/test/foo/bar');
    expect(stripTrailingSep('\\test\\foo\\bar\\')).toEqual('\\test\\foo\\bar');
    done();
  });

  it('strips multiple trailing separators', function(done) {
    expect(stripTrailingSep('/test//')).toEqual('/test');
    expect(stripTrailingSep('\\test\\\\')).toEqual('\\test');
    done();
  });

  it('leaves the 1st separator in a string of only separators', function(done) {
    expect(stripTrailingSep('//')).toEqual('/');
    expect(stripTrailingSep('////')).toEqual('/');
    expect(stripTrailingSep('\\\\')).toEqual('\\');
    expect(stripTrailingSep('\\\\\\\\')).toEqual('\\');
    done();
  });

  it('does not change an empty string', function(done) {
    expect(stripTrailingSep('')).toEqual('');
    done();
  });
});
