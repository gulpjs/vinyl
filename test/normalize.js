var normalize = require('../lib/normalize');
var path = require('path');
require('should');
require('mocha');

describe('normalize()', function() {
  it('should leave empty strings unmodified', function() {
    normalize('').should.equal('');
  });

  it('should apply path.normalize for everything else', function() {
    var str = '/foo//../bar/baz';
    normalize(str).should.equal(path.normalize(str));
  });
});
