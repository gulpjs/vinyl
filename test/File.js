var File = require('../');
var Stream = require('stream');

var should = require('should');
require('mocha');

describe('File', function() {

  describe('constructor()', function() {
    it('should default cwd to process.cwd', function(done) {
      var file = new File();
      file.cwd.should.equal(process.cwd());
      done();
    });

    it('should default base to cwd', function(done) {
      var cwd = "/";
      var file = new File({cwd: cwd});
      file.base.should.equal(cwd);
      done();
    });

    it('should default base to cwd even when none is given', function(done) {
      var file = new File();
      file.base.should.equal(process.cwd());
      done();
    });

    it('should default path to null', function(done) {
      var file = new File();
      should.not.exist(file.path);
      done();
    });

    it('should default stat to null', function(done) {
      var file = new File();
      should.not.exist(file.stat);
      done();
    });

    it('should default contents to null', function(done) {
      var file = new File();
      should.not.exist(file.contents);
      done();
    });

    it('should set base to given value', function(done) {
      var val = "/";
      var file = new File({base: val});
      file.base.should.equal(val);
      done();
    });

    it('should set cwd to given value', function(done) {
      var val = "/";
      var file = new File({cwd: val});
      file.cwd.should.equal(val);
      done();
    });

    it('should set path to given value', function(done) {
      var val = "/test.coffee";
      var file = new File({path: val});
      file.path.should.equal(val);
      done();
    });

    it('should set stat to given value', function(done) {
      var val = {};
      var file = new File({stat: val});
      file.stat.should.equal(val);
      done();
    });

    it('should set contents to given value', function(done) {
      var val = new Stream();
      var file = new File({contents: val});
      file.contents.should.equal(val);
      done();
    });
  });

  describe('isNull()', function() {

    it('should return false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({contents: val});
      file.isNull().should.equal(false);
      done();
    });

    it('should return true when the contents are a null', function(done) {
      var file = new File({contents: null});
      file.isNull().should.equal(true);
      done();
    });
  });

  describe('isDirectory()', function() {
    var fakeStat = {
      isDirectory: function() {
        return true;
      }
    };

    it('should return false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({contents: val, stat: fakeStat});
      file.isDirectory().should.equal(false);
      done();
    });

    it('should return true when the contents are a null', function(done) {
      var file = new File({contents: null, stat: fakeStat});
      file.isDirectory().should.equal(true);
      done();
    });
  });

  describe('clone()', function() {

    it('should copy all attributes over with Stream', function(done) {
      var options = {
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee",
        contents: new Stream(),
        buffer: false
      };
      var file = new File(options);
      var file2 = file.clone();

      file2.should.not.equal(file, 'refs should be different');
      file2.cwd.should.equal(file.cwd);
      file2.base.should.equal(file.base);
      file2.path.should.equal(file.path);
      file2.contents.should.equal(file.contents, 'stream ref should be the same');
      done();
    });

    it('should copy all attributes over with null', function(done) {
      var options = {
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee",
        contents: null
      };
      var file = new File(options);
      var file2 = file.clone();

      file2.should.not.equal(file, 'refs should be different');
      file2.cwd.should.equal(file.cwd);
      file2.base.should.equal(file.base);
      file2.path.should.equal(file.path);
      should.not.exist(file2.contents);
      done();
    });
  });
  
  describe('pipe()', function() {

    it('should pipe the internal stream and end given stream', function(done) {
      var testChunk = new Buffer("test");
      var options = {
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee",
        contents: new Stream.PassThrough()
      };
      var file = new File(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function(chunk) {
        should.exist(chunk);
        (chunk instanceof Buffer).should.equal(true, 'should write as a buffer');
        chunk.toString('utf8').should.equal(testChunk.toString('utf8'));
        done();
      });
      var ret = file.pipe(stream);
      ret.should.equal(stream, 'should return the stream');

      file.contents.write(testChunk);
    });

    it('should end the given stream when contents is null and end is set to true', function(done) {
      var options = {
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee",
        contents: null
      };
      var file = new File(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function(chunk) {
        throw new Error("should not write");
      });
      stream.on('end', function() {
        done();
      });
      var ret = file.pipe(stream);
      ret.should.equal(stream, 'should return the stream');
    });

    it('should pipe to stream with Stream', function(done) {
      var testChunk = new Buffer("test");
      var options = {
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee",
        contents: new Stream.PassThrough()
      };
      var file = new File(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function(chunk) {
        should.exist(chunk);
        (chunk instanceof Buffer).should.equal(true, 'should write as a buffer');
        chunk.toString('utf8').should.equal(testChunk.toString('utf8'));
        done();
      });
      stream.on('end', function(chunk) {
        throw new Error("should not end");
      });
      var ret = file.pipe(stream, {end: false});
      ret.should.equal(stream, 'should return the stream');

      file.contents.write(testChunk);
    });

    it('should do nothing with null and end set to false', function(done) {
      var options = {
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee",
        contents: null
      };
      var file = new File(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function(chunk) {
        throw new Error("should not write");
      });
      stream.on('end', function(chunk) {
        throw new Error("should not end");
      });
      var ret = file.pipe(stream, {end: false});
      ret.should.equal(stream, 'should return the stream');
      process.nextTick(done);
    });
  });
  
  describe('inspect()', function() {
    it('should return correct format when no contents and no path', function(done) {
      var file = new File();
      file.inspect().should.equal('<File >');
      done();
    });

    it('should return correct format when Stream and relative path', function(done) {
      var file = new File({
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee",
        contents: new Stream.PassThrough()
      });
      file.inspect().should.equal('<File "test.coffee" <PassThroughStream>>');
      done();
    });

    it('should return correct format when null and relative path', function(done) {
      var file = new File({
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee",
        contents: null
      });
      file.inspect().should.equal('<File "test.coffee">');
      done();
    });
  });
  
  describe('contents get/set', function() {
    it('should not work with Buffers', function(done) {
      should(function() {
        var val = new Buffer("test");
        var file = new File();
        file.contents = val;
      }).throw(Error);
      done();
    });

    it('should work with Stream', function(done) {
      var val = new Stream.PassThrough();
      var file = new File();
      file.contents = val;
      file.contents.should.equal(val);
      done();
    });

    it('should work with null', function(done) {
      var val = null;
      var file = new File();
      file.contents = val;
      (file.contents === null).should.equal(true);
      done();
    });

    it('should not work with string', function(done) {
      var val = "test";
      var file = new File();
      try {
        file.contents = val;
      } catch (err) {
        should.exist(err);
        done();
      }
    });
  });

  describe('relative get/set', function() {
    it('should error on set', function(done) {
      var file = new File();
      try {
        file.relative = "test";
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should error on get when no base', function(done) {
      var a;
      var file = new File();
      delete file.base;
      try {
        a = file.relative;
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should error on get when no path', function(done) {
      var a;
      var file = new File();
      try {
        a = file.relative;
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should return a relative path from base', function(done) {
      var file = new File({
        cwd: "/",
        base: "/test/",
        path: "/test/test.coffee"
      });
      file.relative.should.equal("test.coffee");
      done();
    });

    it('should return a relative path from cwd', function(done) {
      var file = new File({
        cwd: "/",
        path: "/test/test.coffee"
      });
      file.relative.should.equal("test/test.coffee");
      done();
    });
  });

});
