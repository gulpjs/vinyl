var stripTrailingSep = require('../lib/stripTrailingSep');
require('should');
require('mocha');

describe('stripTrailingSep()', function() {
  it('should strip trailing separator', function() {
    stripTrailingSep('foo/').should.equal('foo');
    stripTrailingSep('foo\\').should.equal('foo');
  });

  it('should not strip when the only char in the string', function() {
    stripTrailingSep('/').should.equal('/');
    stripTrailingSep('\\').should.equal('\\');
  });

  it('should strip only the trailing separator', function() {
    stripTrailingSep('/test/foo/bar/').should.equal('/test/foo/bar');
    stripTrailingSep('\\test\\foo\\bar\\').should.equal('\\test\\foo\\bar');
  });

  it('should strip multiple trailing separators', function() {
    stripTrailingSep('/test//').should.equal('/test');
    stripTrailingSep('\\test\\\\').should.equal('\\test');
  });

  it('should leave 1st separator in a string of only separators', function() {
    stripTrailingSep('//').should.equal('/');
    stripTrailingSep('////').should.equal('/');
    stripTrailingSep('\\\\').should.equal('\\');
    stripTrailingSep('\\\\\\\\').should.equal('\\');
  });

  it('should return back empty string', function() {
    stripTrailingSep('').should.equal('');
  });
});
