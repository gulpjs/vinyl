'use strict';

var path = require('path');
var expect = require('expect');

var normalize = require('../lib/normalize');

describe('normalize()', function() {

  it('leaves empty strings unmodified', function(done) {
    var result = normalize('');
    expect(result).toEqual('');
    done();
  });

  it('applies path.normalize for everything else', function(done) {
    var str = '/foo//../bar/baz';
    var result = normalize(str);
    expect(result).toEqual(path.normalize(str));
    done();
  });
});
