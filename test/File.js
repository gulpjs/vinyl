var Stream = require('readable-stream');
var fs = require('fs');
var path = require('path');
var es = require('event-stream');
var File = require('../');

var should = require('should');
require('mocha');

describe('File', function() {
  describe('isVinyl()', function() {
    it('should return true on a vinyl object', function(done) {
      var file = new File();
      File.isVinyl(file).should.equal(true);
      done();
    });
    it('should return false on a normal object', function(done) {
      File.isVinyl({}).should.equal(false);
      done();
    });
    it('should return false on a null object', function(done) {
      File.isVinyl(null).should.equal(false);
      done();
    });
  });
  describe('constructor()', function() {
    it('should default cwd to process.cwd', function(done) {
      var file = new File();
      file.cwd.should.equal(process.cwd());
      done();
    });

    it('should default base to cwd', function(done) {
      var cwd = path.normalize('/');
      var file = new File({ cwd: cwd });
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

    it('should default history to []', function(done) {
      var file = new File();
      file.history.should.eql([]);
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
      var val = path.normalize('/');
      var file = new File({ base: val });
      file.base.should.equal(val);
      done();
    });

    it('should set cwd to given value', function(done) {
      var val = path.normalize('/');
      var file = new File({ cwd: val });
      file.cwd.should.equal(val);
      done();
    });

    it('should set path to given value', function(done) {
      var val = path.normalize('/test.coffee');
      var file = new File({ path: val });
      file.path.should.equal(val);
      file.history.should.eql([val]);
      done();
    });

    it('should set history to given value', function(done) {
      var val = path.normalize('/test.coffee');
      var file = new File({ history: [val] });
      file.path.should.equal(val);
      file.history.should.eql([val]);
      done();
    });

    it('should set stat to given value', function(done) {
      var val = {};
      var file = new File({ stat: val });
      file.stat.should.equal(val);
      done();
    });

    it('should set contents to given value', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      file.contents.should.equal(val);
      done();
    });

    it('should set custom properties', function(done) {
      var sourceMap = {};
      var file = new File({ sourceMap: sourceMap });
      file.sourceMap.should.equal(sourceMap);
      done();
    });

    it('should normalize path', function() {
      var file = new File({ path: '/test/foo/../test.coffee' });

      if (process.platform === 'win32') {
        file.path.should.equal('\\test\\test.coffee');
        file.history.should.eql(['\\test\\test.coffee']);
      } else {
        file.path.should.equal('/test/test.coffee');
        file.history.should.eql(['/test/test.coffee']);
      }
    });

    it('should correctly normalize and strip trailing sep from path', function() {
      var file = new File({ path: '/test/foo/../foo/' });

      if (process.platform === 'win32') {
        file.path.should.equal('\\test\\foo');
      } else {
        file.path.should.equal('/test/foo');
      }
    });

    it('should correctly normalize and strip trailing sep from history', function() {
      var file = new File({
        history: [
          '/test/foo/../foo/',
          '/test/bar/../bar/',
        ],
      });

      if (process.platform === 'win32') {
        file.history.should.eql([
          '\\test\\foo',
          '\\test\\bar',
        ]);
      } else {
        file.history.should.eql([
          '/test/foo',
          '/test/bar',
        ]);
      }
    });

    it('should normalize history', function() {
      var history = [
        '/test/bar/../bar/test.coffee',
        '/test/foo/../test.coffee',
      ];
      var file = new File({ history: history });

      if (process.platform === 'win32') {
        file.path.should.equal('\\test\\test.coffee');
        file.history.should.eql([
          '\\test\\bar\\test.coffee',
          '\\test\\test.coffee',
        ]);
      } else {
        file.path.should.equal('/test/test.coffee');
        file.history.should.eql([
          '/test/bar/test.coffee',
          '/test/test.coffee',
        ]);
      }
    });

    it('appends path to history if both exist and different from last', function(done) {
      var p = path.normalize('/test/baz/test.coffee');
      var history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
      ];
      var file = new File({ path: p, history: history });

      var expectedHistory = history.concat(p);

      file.path.should.equal(path.normalize('/test/baz/test.coffee'));
      file.history.should.eql(expectedHistory);
      done();
    });

    it('does not append path to history if both exist and same as last', function(done) {
      var history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
        path.normalize('/test/baz/test.coffee'),
      ];
      var file = new File({ path: history[history.length - 1], history: history });

      file.path.should.equal(path.normalize('/test/baz/test.coffee'));
      file.history.should.eql(history);
      done();
    });

    it('does not mutate history array passed in', function(done) {
      var p = path.normalize('/test/baz/test.coffee');
      var history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
      ];
      var historyCopy = Array.prototype.slice.call(history);
      var file = new File({ path: p, history: history });

      var expectedHistory = history.concat(p);

      file.path.should.equal(path.normalize('/test/baz/test.coffee'));
      file.history.should.eql(expectedHistory);
      history.should.eql(historyCopy);
      done();
    });

  });

  describe('isBuffer()', function() {
    it('should return true when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      file.isBuffer().should.equal(true);
      done();
    });

    it('should return false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val });
      file.isBuffer().should.equal(false);
      done();
    });

    it('should return false when the contents are a null', function(done) {
      var file = new File({ contents: null });
      file.isBuffer().should.equal(false);
      done();
    });
  });

  describe('isStream()', function() {
    it('should return false when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      file.isStream().should.equal(false);
      done();
    });

    it('should return true when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val });
      file.isStream().should.equal(true);
      done();
    });

    it('should return false when the contents are a null', function(done) {
      var file = new File({ contents: null });
      file.isStream().should.equal(false);
      done();
    });
  });

  describe('isNull()', function() {
    it('should return false when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      file.isNull().should.equal(false);
      done();
    });

    it('should return false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val });
      file.isNull().should.equal(false);
      done();
    });

    it('should return true when the contents are a null', function(done) {
      var file = new File({ contents: null });
      file.isNull().should.equal(true);
      done();
    });
  });

  describe('isDirectory()', function() {
    var fakeStat = {
      isDirectory: function() {
        return true;
      },
    };

    it('should return false when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val, stat: fakeStat });
      file.isDirectory().should.equal(false);
      done();
    });

    it('should return false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val, stat: fakeStat });
      file.isDirectory().should.equal(false);
      done();
    });

    it('should return true when the contents are a null', function(done) {
      var file = new File({ contents: null, stat: fakeStat });
      file.isDirectory().should.equal(true);
      done();
    });

    it('returns false when the stats exist but do not contain isDirectory method', function(done) {
      var file = new File({ contents: null, stat: {} });
      file.isDirectory().should.equal(false);
      done();
    });
  });

  describe('isSymbolic()', function() {
    var fakeStat = {
      isSymbolicLink: function() {
        return true;
      },
    };

    it('should return false when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val, stat: fakeStat });
      file.isSymbolic().should.equal(false);
      done();
    });

    it('should return false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val, stat: fakeStat });
      file.isSymbolic().should.equal(false);
      done();
    });

    it('should return true when the contents are a null', function(done) {
      var file = new File({ contents: null, stat: fakeStat });
      file.isSymbolic().should.equal(true);
      done();
    });

    it('returns false when the stats exist but do not contain isSymbolicLink method', function(done) {
      var file = new File({ contents: null, stat: {} });
      file.isSymbolic().should.equal(false);
      done();
    });
  });

  describe('clone()', function() {
    it('should copy all attributes over with Buffer', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Buffer('test'),
      };
      var file = new File(options);
      var file2 = file.clone();

      file2.should.not.equal(file, 'refs should be different');
      file2.cwd.should.equal(file.cwd);
      file2.base.should.equal(file.base);
      file2.path.should.equal(file.path);
      file2.contents.should.not.equal(file.contents, 'buffer ref should be different');
      file2.contents.toString('utf8').should.equal(file.contents.toString('utf8'));
      done();
    });

    it('should copy buffer\'s reference with option contents: false', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test'),
      };

      var file = new File(options);

      var copy1 = file.clone({ contents: false });
      copy1.contents.should.equal(file.contents);

      var copy2 = file.clone({});
      copy2.contents.should.not.equal(file.contents);

      var copy3 = file.clone({ contents: 'any string' });
      copy3.contents.should.not.equal(file.contents);

      done();
    });

    it('should copy all attributes over with Stream', function(done) {
      var contents = new Stream.PassThrough();
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: contents,
      };
      var file = new File(options);
      var file2 = file.clone();

      contents.write(new Buffer('wa'));

      process.nextTick(function() {
        contents.write(new Buffer('dup'));
        contents.end();
      });

      file2.should.not.equal(file, 'refs should be different');
      file2.cwd.should.equal(file.cwd);
      file2.base.should.equal(file.base);
      file2.path.should.equal(file.path);
      file2.contents.should.not.equal(file.contents, 'stream ref should not be the same');
      file.contents.pipe(es.wait(function(err, data) {
        file2.contents.pipe(es.wait(function(err, data2) {
          data2.should.not.equal(data, 'stream contents ref should not be the same');
          data2.should.eql(data, 'stream contents should be the same');
        }));
      }));
      done();
    });

    it('should copy all attributes over with null', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
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

    it('should properly clone the `stat` property', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test'),
        stat: fs.statSync(__filename),
      };

      var file = new File(options);
      var copy = file.clone();

      copy.stat.isFile().should.equal(true);
      copy.stat.isDirectory().should.equal(false);
      should(file.stat instanceof fs.Stats).equal(true);
      should(copy.stat instanceof fs.Stats).equal(true);

      done();
    });

    it('should properly clone the `history` property', function(done) {
      var options = {
        cwd: path.normalize('/'),
        base: path.normalize('/test/'),
        path: path.normalize('/test/test.js'),
        contents: new Buffer('test'),
        stat: fs.statSync(__filename),
      };

      var file = new File(options);
      var copy = file.clone();

      copy.history[0].should.equal(options.path);
      copy.path = 'lol';
      file.path.should.not.equal(copy.path);
      done();
    });

    it('should copy custom properties', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      };

      var file = new File(options);
      file.custom = { a: 'custom property' };

      var file2 = file.clone();

      file2.should.not.equal(file, 'refs should be different');
      file2.cwd.should.equal(file.cwd);
      file2.base.should.equal(file.base);
      file2.path.should.equal(file.path);
      file2.custom.should.not.equal(file.custom);
      file2.custom.a.should.equal(file.custom.a);

      done();
    });

    it('should copy history', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      };
      var history = [
        path.normalize('/test/test.coffee'),
        path.normalize('/test/test.js'),
        path.normalize('/test/test-938di2s.js'),
      ];

      var file = new File(options);
      file.path = history[1];
      file.path = history[2];
      var file2 = file.clone();

      file2.history.should.eql(history);
      file2.history.should.not.equal(history);
      file2.path.should.eql(history[2]);

      done();
    });

    it('should copy all attributes deeply', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      };

      var file = new File(options);
      file.custom = { a: 'custom property' };

      var file2 = file.clone(true);
      file2.custom.should.eql(file.custom);
      file2.custom.should.not.equal(file.custom);
      file2.custom.a.should.equal(file.custom.a);

      var file3 = file.clone({ deep: true });
      file3.custom.should.eql(file.custom);
      file3.custom.should.not.equal(file.custom);
      file3.custom.a.should.equal(file.custom.a);

      var file4 = file.clone(false);
      file4.custom.should.eql(file.custom);
      file4.custom.should.equal(file.custom);
      file4.custom.a.should.equal(file.custom.a);

      var file5 = file.clone({ deep: false });
      file5.custom.should.eql(file.custom);
      file5.custom.should.equal(file.custom);
      file5.custom.a.should.equal(file.custom.a);

      done();
    });

    it('should work with extended files', function(done) {
      function ExtendedFile() {
        File.apply(this, arguments);
      }
      ExtendedFile.prototype = Object.create(File.prototype);
      ExtendedFile.prototype.constructor = ExtendedFile;
      // Object.setPrototypeOf(ExtendedFile, File);
      // Just copy static stuff since Object.setPrototypeOf is node >=0.12
      Object.keys(File).forEach(function(key) {
        ExtendedFile[key] = File[key];
      });

      var file = new ExtendedFile();
      var file2 = file.clone();

      file2.should.not.equal(file, 'refs should be different');
      file2.constructor.should.equal(ExtendedFile);
      (file2 instanceof ExtendedFile).should.equal(true);
      (file2 instanceof File).should.equal(true);
      ExtendedFile.prototype.isPrototypeOf(file2).should.equal(true);
      File.prototype.isPrototypeOf(file2).should.equal(true);
      done();
    });
  });

  describe('inspect()', function() {
    it('should return correct format when no contents and no path', function(done) {
      var file = new File();
      file.inspect().should.equal('<File >');
      done();
    });

    it('should return correct format when Buffer and no path', function(done) {
      var val = new Buffer('test');
      var file = new File({
        contents: val,
      });
      file.inspect().should.equal('<File <Buffer 74 65 73 74>>');
      done();
    });

    it('should return correct format when Buffer and relative path', function(done) {
      var val = new Buffer('test');
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: val,
      });
      file.inspect().should.equal('<File "test.coffee" <Buffer 74 65 73 74>>');
      done();
    });

    it('should return correct format when Stream and relative path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Stream.PassThrough(),
      });
      file.inspect().should.equal('<File "test.coffee" <PassThroughStream>>');
      done();
    });

    it('should return correct format when null and relative path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      });
      file.inspect().should.equal('<File "test.coffee">');
      done();
    });
  });

  describe('contents get/set', function() {
    it('should work with Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File();
      file.contents = val;
      file.contents.should.equal(val);
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
      var val = 'test';
      var file = new File();
      try {
        file.contents = val;
      } catch (err) {
        should.exist(err);
        done();
      }
    });
  });

  describe('cwd get/set', function() {
    it('should return _cwd', function() {
      var file = new File();
      file.cwd = '/test';
      file.cwd.should.equal(file._cwd);
    });

    it('should set cwd', function() {
      var file = new File();
      file.cwd = '/test';
      file._cwd.should.equal(path.normalize('/test'));
    });

    it('should normalize and strip trailing sep on set', function() {
      var file = new File();

      file.cwd = '/test/foo/../foo/';

      if (process.platform === 'win32') {
        file.cwd.should.equal('\\test\\foo');
      } else {
        file.cwd.should.equal('/test/foo');
      }

      file.cwd = '\\test\\foo\\..\\foo\\';

      if (process.platform === 'win32') {
        file.cwd.should.equal('\\test\\foo');
      } else {
        file.cwd.should.equal('\\test\\foo\\..\\foo');
      }
    });

    it('should throw on set when value is empty or not a string', function() {
      var notAllowed = [
        '', null, undefined, true, false, 0, Infinity, NaN, {}, [],
      ];
      notAllowed.forEach(function(val) {
        (function() {
          new File().cwd = val;
        }).should.throw('cwd must be a non-empty string.');
      });
    });
  });

  describe('base get/set', function() {
    it('should proxy to cwd when omitted', function() {
      var file = new File({
        cwd: '/test',
      });
      file.base.should.equal(path.normalize('/test'));
    });

    it('should proxy to cwd when same', function() {
      var file = new File({
        cwd: '/test',
        base: '/test',
      });
      file.cwd = '/foo/';
      file.base.should.equal(path.normalize('/foo'));

      var file2 = new File({
        cwd: '/test',
      });
      file2.base = '/test/';
      file2.cwd = '/foo/';
      file2.base.should.equal(path.normalize('/foo'));
    });

    it('should proxy to cwd when null or undefined', function() {
      var file = new File({
        cwd: '/foo',
        base: '/bar',
      });
      file.base.should.equal(path.normalize('/bar'));
      file.base = null;
      file.base.should.equal(path.normalize('/foo'));
      file.base = '/bar/';
      file.base.should.equal(path.normalize('/bar'));
      file.base = undefined;
      file.base.should.equal(path.normalize('/foo'));
    });

    it('should return _base', function() {
      var file = new File();
      file._base = '/test/';
      file.base.should.equal('/test/');
    });

    it('should set base', function() {
      var file = new File();
      file.base = '/test/foo';
      file.base.should.equal(path.normalize('/test/foo'));
    });

    it('should normalize and strip trailing sep on set', function() {
      var file = new File();

      file.base = '/test/foo/../foo/';

      if (process.platform === 'win32') {
        file.base.should.equal('\\test\\foo');
      } else {
        file.base.should.equal('/test/foo');
      }

      file.base = '\\test\\foo\\..\\foo\\';

      if (process.platform === 'win32') {
        file.base.should.equal('\\test\\foo');
      } else {
        file.base.should.equal('\\test\\foo\\..\\foo');
      }
    });

    it('should throw on set when not null/undefined or a non-empty string', function() {
      var notStrings = [true, false, 1, 0, Infinity, NaN, '', {}, []];
      notStrings.forEach(function(val) {
        (function() {
          new File().base = val;
        }).should.throw('base must be a non-empty string, or null/undefined.');
      });
    });
  });

  describe('relative get/set', function() {
    it('should error on set', function(done) {
      var file = new File();
      try {
        file.relative = 'test';
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
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });
      file.relative.should.equal('test.coffee');
      done();
    });

    it('should return a relative path from cwd', function(done) {
      var file = new File({
        cwd: '/',
        path: '/test/test.coffee',
      });
      file.relative.should.equal(path.join('test','test.coffee'));
      done();
    });

    it('should not append sep when directory', function() {
      var file = new File({
        base: '/test',
        path: '/test/foo/bar',
        stat: {
          isDirectory: function() {
            return true;
          },
        },
      });
      file.relative.should.equal(path.normalize('foo/bar'));
    });

    it('should not append sep when directory & simlink', function() {
      var file = new File({
        base: '/test',
        path: '/test/foo/bar',
        stat: {
          isDirectory: function() {
            return true;
          },
          isSymbolicLink: function() {
            return true;
          },
        },
      });
      file.relative.should.equal(path.normalize('foo/bar'));
    });
  });

  describe('dirname get/set', function() {
    it('should error on get when no path', function(done) {
      var a;
      var file = new File();
      try {
        a = file.dirname;
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should return the path without trailing sep', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test',
        path: '/test/test.coffee',
      });
      file.dirname.should.equal(path.normalize('/test'));
      done();
    });

    it('should error on set when no path', function(done) {
      var file = new File();
      try {
        file.dirname = '/test';
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should set the dirname of the path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });
      file.dirname = '/test/foo';
      file.path.should.equal(path.normalize('/test/foo/test.coffee'));
      done();
    });
  });

  describe('basename get/set', function() {
    it('should error on get when no path', function(done) {
      var a;
      var file = new File();
      try {
        a = file.basename;
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should return the basename of the path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });
      file.basename.should.equal('test.coffee');
      done();
    });

    it('should not append trailing sep', function() {
      var file = new File({
        path: '/test/foo',
        stat: {
          isDirectory: function() {
            return true;
          },
        },
      });
      file.basename.should.equal('foo');

      var file2 = new File({
        path: '/test/foo',
        stat: {
          isSymbolicLink: function() {
            return true;
          },
        },
      });
      file2.basename.should.equal('foo');

      var file3 = new File({
        path: '/test/foo',
        stat: {
          isDirectory: function() {
            return true;
          },
          isSymbolicLink: function() {
            return true;
          },
        },
      });
      file3.basename.should.equal('foo');
    });

    it('should error on set when no path', function(done) {
      var file = new File();
      try {
        file.basename = 'test.coffee';
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should set the basename of the path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });
      file.basename = 'foo.png';
      file.path.should.equal(path.normalize('/test/foo.png'));
      done();
    });
  });

  describe('stem get/set', function() {
    it('should error on get when no path', function(done) {
      var a;
      var file = new File();
      try {
        a = file.stem;
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should return the stem of the path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });
      file.stem.should.equal('test');
      done();
    });

    it('should error on set when no path', function(done) {
      var file = new File();
      try {
        file.stem = 'test.coffee';
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should set the stem of the path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });
      file.stem = 'foo';
      file.path.should.equal(path.normalize('/test/foo.coffee'));
      done();
    });
  });

  describe('extname get/set', function() {
    it('should error on get when no path', function(done) {
      var a;
      var file = new File();
      try {
        a = file.extname;
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should return the extname of the path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });
      file.extname.should.equal('.coffee');
      done();
    });

    it('should error on set when no path', function(done) {
      var file = new File();
      try {
        file.extname = '.coffee';
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should set the extname of the path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });
      file.extname = '.png';
      file.path.should.equal(path.normalize('/test/test.png'));
      done();
    });
  });

  describe('path get/set', function() {
    it('should record history when instantiation', function() {
      var file = new File({
        cwd: '/',
        path: '/test/test.coffee',
      });
      var history = [path.normalize('/test/test.coffee')];

      file.path.should.eql(history[0]);
      file.history.should.eql(history);
    });

    it('should record history when path change', function() {
      var file = new File({
        cwd: '/',
        path: '/test/test.coffee',
      });
      var history = [
        path.normalize('/test/test.coffee'),
        path.normalize('/test/test.js'),
      ];

      file.path = history[history.length - 1];
      file.path.should.eql(history[history.length - 1]);
      file.history.should.eql(history);

      history.push(path.normalize('/test/test.es6'));

      file.path = history[history.length - 1];
      file.path.should.eql(history[history.length - 1]);
      file.history.should.eql(history);
    });

    it('should not record history when set the same path', function() {
      var val = path.normalize('/test/test.coffee');
      var file = new File({
        cwd: '/',
        path: val,
      });

      file.path = val;
      file.path = val;
      file.path.should.eql(val);
      file.history.should.eql([val]);

      // Ignore when set empty string
      file.path = '';
      file.path.should.eql(val);
      file.history.should.eql([val]);
    });

    it('should throw when set path null', function() {
      var file = new File({
        cwd: '/',
        path: null,
      });

      should.not.exist(file.path);
      file.history.should.eql([]);

      (function() {
        file.path = null;
      }).should.throw('path should be a string.');
    });

    it('should normalize the path on set', function() {
      var file = new File();

      file.path = '/test/foo/../test.coffee';

      if (process.platform === 'win32') {
        file.path.should.equal('\\test\\test.coffee');
        file.history.should.eql(['\\test\\test.coffee']);
      } else {
        file.path.should.equal('/test/test.coffee');
        file.history.should.eql(['/test/test.coffee']);
      }
    });

    it('should strip trailing sep', function() {
      var file = new File();
      file.path = '/test/';
      file.path.should.eql(path.normalize('/test'));
      file.history.should.eql([path.normalize('/test')]);

      var file2 = new File({
        stat: {
          isDirectory: function() {
            return true;
          },
        },
      });
      file2.path = '/test/';
      file2.path.should.eql(path.normalize('/test'));
      file2.history.should.eql([path.normalize('/test')]);
    });
  });

  describe('symlink get/set', function() {
    it('should return null on get when no symlink', function(done) {
      var file = new File();
      var a = file.symlink;
      should.not.exist(a);
      done();
    });

    it('should return the symlink if set', function(done) {
      var file = new File({
        symlink: '/test/test.coffee',
      });
      file.symlink.should.equal(path.normalize('/test/test.coffee'));
      done();
    });

    it('should error on set with non-string symlink', function(done) {
      var file = new File();
      try {
        file.symlink = null;
      } catch (err) {
        should.exist(err);
        done();
      }
    });

    it('should set the symlink', function(done) {
      var file = new File();
      file.symlink = '/test/test.coffee';
      file.symlink.should.equal(path.normalize('/test/test.coffee'));
      done();
    });

    it('should set the relative symlink', function(done) {
      var file = new File();
      file.symlink = 'test.coffee';
      file.symlink.should.equal('test.coffee');
      done();
    });

    it('should be normalized and stripped off a trailing sep on set', function() {
      var file = new File();

      file.symlink = '/test/foo/../bar/';

      if (process.platform === 'win32') {
        file.symlink.should.equal('\\test\\bar');
      } else {
        file.symlink.should.equal('/test/bar');
      }
    });
  });
});
