var endWithSep = require('../lib/endWithSep');
var path = require('path');
require('should');
require('mocha');

describe('endWithSep()', function() {
  it('should append path.sep when there is none', function() {
    endWithSep('foo').should.equal('foo' + path.sep);
  });

  it('should not duplicate path.sep', function() {
    endWithSep('foo' + path.sep).should.equal('foo' + path.sep);
  });

  it('should use path.sep', function() {
    var originalSep = path.sep;
    path.sep = '*';
    endWithSep('foo').should.equal('foo' + path.sep);
    endWithSep('foo' + path.sep).should.equal('foo' + path.sep);
    path.sep = originalSep;
  });
});
