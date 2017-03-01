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

  it('keeps remote urls', function(done) {
    var checks = [
      ['https://github.com/gulpjs/vinyl/issues/127', 'https://github.com/gulpjs/vinyl/issues/127'],
      ['http://github.com/gulpjs/vinyl/issues///127', 'http://github.com/gulpjs/vinyl/issues/127'],
      ['https://github.com/gulpjs/vinyl/issues/../baz/bar', 'https://github.com/gulpjs/vinyl/baz/bar'],
      ['//github.com/gulpjs/vinyl/issues/../../gulp/', '//github.com/gulpjs/gulp/'],
      ['www.github.com/gulpjs/vinyl/issues/../../gulp', 'www.github.com/gulpjs/gulp'],
    ];

    for (var i = 0; i < checks.length; i++) {
      var check = checks[i];
      var result = normalize(check[0]);
      expect(result).toEqual(check[1]);
    }

    done();
  });
});
