'use strict';

var fs = require('fs');
var path = require('path');
var expect = require('expect');
var Stream = require('readable-stream');
var miss = require('mississippi');

var File = require('../');

var should = require('should');

var pipe = miss.pipe;
var from = miss.from;
var concat = miss.concat;

describe('File', function() {

  describe('isVinyl()', function() {

    it('returns true for a Vinyl object', function(done) {
      var file = new File();
      var result = File.isVinyl(file);
      expect(result).toEqual(true);
      done();
    });

    it('returns false for a normal object', function(done) {
      var result = File.isVinyl({});
      expect(result).toEqual(false);
      done();
    });

    it('returns false for null', function(done) {
      var result = File.isVinyl(null);
      expect(result).toEqual(false);
      done();
    });

    it('returns false for a string', function(done) {
      var result = File.isVinyl('foobar');
      expect(result).toEqual(false);
      done();
    });

    it('returns false for a String object', function(done) {
      var result = File.isVinyl(new String('foobar'));
      expect(result).toEqual(false);
      done();
    });

    it('returns false for a number', function(done) {
      var result = File.isVinyl(1);
      expect(result).toEqual(false);
      done();
    });

    it('returns false for a Number object', function(done) {
      var result = File.isVinyl(new Number(1));
      expect(result).toEqual(false);
      done();
    });

    // This is based on current implementation
    // A test was added to document and make aware during internal changes
    // TODO: decide if this should be leak-able
    it('returns true for a mocked object', function(done) {
      var result = File.isVinyl({ _isVinyl: true });
      expect(result).toEqual(true);
      done();
    });
  });

  describe('defaults', function() {

    it('defaults cwd to process.cwd', function(done) {
      var file = new File();
      expect(file.cwd).toEqual(process.cwd());
      done();
    });

    it('defaults base to process.cwd', function(done) {
      var file = new File();
      expect(file.base).toEqual(process.cwd());
      done();
    });

    it('defaults base to cwd property', function(done) {
      var cwd = path.normalize('/');
      var file = new File({ cwd: cwd });
      expect(file.base).toEqual(cwd);
      done();
    });

    it('defaults path to null', function(done) {
      var file = new File();
      expect(file.path).toNotExist();
      expect(file.path).toEqual(null);
      done();
    });

    it('defaults history to an empty array', function(done) {
      var file = new File();
      expect(file.history).toEqual([]);
      done();
    });

    it('defaults stat to null', function(done) {
      var file = new File();
      expect(file.stat).toNotExist();
      expect(file.stat).toEqual(null);
      done();
    });

    it('defaults contents to null', function(done) {
      var file = new File();
      expect(file.contents).toNotExist();
      expect(file.contents).toEqual(null);
      done();
    });
  });

  describe('constructor()', function() {

    it('sets base', function(done) {
      var val = path.normalize('/');
      var file = new File({ base: val });
      expect(file.base).toEqual(val);
      done();
    });

    it('sets cwd', function(done) {
      var val = path.normalize('/');
      var file = new File({ cwd: val });
      expect(file.cwd).toEqual(val);
      done();
    });

    it('sets path (and history)', function(done) {
      var val = path.normalize('/test.coffee');
      var file = new File({ path: val });
      expect(file.path).toEqual(val);
      expect(file.history).toEqual([val]);
      done();
    });

    it('sets history (and path)', function(done) {
      var val = path.normalize('/test.coffee');
      var file = new File({ history: [val] });
      expect(file.path).toEqual(val);
      expect(file.history).toEqual([val]);
      done();
    });

    it('sets stat', function(done) {
      var val = {};
      var file = new File({ stat: val });
      expect(file.stat).toEqual(val);
      done();
    });

    it('sets contents', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      expect(file.contents).toEqual(val);
      done();
    });

    it('sets custom properties', function(done) {
      var sourceMap = {};
      var file = new File({ sourceMap: sourceMap });
      expect(file.sourceMap).toEqual(sourceMap);
      done();
    });

    it('normalizes path', function() {
      var val = '/test/foo/../test.coffee';
      var expected = path.normalize(val);
      var file = new File({ path: val });
      expect(file.path).toEqual(expected);
      expect(file.history).toEqual([expected]);
    });

    it('normalizes and strips trailing separator from path', function() {
      var val = '/test/foo/../foo/';
      var expected = path.normalize(val.slice(0, -1));
      var file = new File({ path: val });
      expect(file.path).toEqual(expected);
    });

    it('normalizes history', function() {
      var val = [
        '/test/bar/../bar/test.coffee',
        '/test/foo/../test.coffee',
      ];
      var expected = val.map(function(p) {
        return path.normalize(p);
      });
      var file = new File({ history: val });
      expect(file.path).toEqual(expected[1]);
      expect(file.history).toEqual(expected);
    });

    it('normalizes and strips trailing separator from history', function() {
      var val = [
        '/test/foo/../foo/',
        '/test/bar/../bar/',
      ];
      var expected = val.map(function(p) {
        return path.normalize(p.slice(0, -1));
      });
      var file = new File({ history: val });
      expect(file.history).toEqual(expected);
    });

    it('appends path to history if both exist and different from last', function(done) {
      var val = path.normalize('/test/baz/test.coffee');
      var history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
      ];
      var file = new File({ path: val, history: history });

      var expectedHistory = history.concat(val);

      expect(file.path).toEqual(val);
      expect(file.history).toEqual(expectedHistory);
      done();
    });

    it('does not append path to history if both exist and same as last', function(done) {
      var val = path.normalize('/test/baz/test.coffee');
      var history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
        val,
      ];
      var file = new File({ path: val, history: history });

      expect(file.path).toEqual(val);
      expect(file.history).toEqual(history);
      done();
    });

    it('does not mutate history array passed in', function(done) {
      var val = path.normalize('/test/baz/test.coffee');
      var history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
      ];
      var historyCopy = Array.prototype.slice.call(history);
      var file = new File({ path: val, history: history });

      var expectedHistory = history.concat(val);

      expect(file.path).toEqual(val);
      expect(file.history).toEqual(expectedHistory);
      expect(history).toEqual(historyCopy);
      done();
    });
  });

  describe('isBuffer()', function() {

    it('returns true when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      expect(file.isBuffer()).toEqual(true);
      done();
    });

    it('returns false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val });
      expect(file.isBuffer()).toEqual(false);
      done();
    });

    it('returns false when the contents are null', function(done) {
      var file = new File({ contents: null });
      expect(file.isBuffer()).toEqual(false);
      done();
    });
  });

  describe('isStream()', function() {

    it('returns false when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      expect(file.isStream()).toEqual(false);
      done();
    });

    it('returns true when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val });
      expect(file.isStream()).toEqual(true);
      done();
    });

    it('returns false when the contents are null', function(done) {
      var file = new File({ contents: null });
      expect(file.isStream()).toEqual(false);
      done();
    });
  });

  describe('isNull()', function() {

    it('returns false when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      expect(file.isNull()).toEqual(false);
      done();
    });

    it('returns false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val });
      expect(file.isNull()).toEqual(false);
      done();
    });

    it('returns true when the contents are null', function(done) {
      var file = new File({ contents: null });
      expect(file.isNull()).toEqual(true);
      done();
    });
  });

  describe('isDirectory()', function() {
    var fakeStat = {
      isDirectory: function() {
        return true;
      },
    };

    it('returns false when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val, stat: fakeStat });
      expect(file.isDirectory()).toEqual(false);
      done();
    });

    it('returns false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val, stat: fakeStat });
      expect(file.isDirectory()).toEqual(false);
      done();
    });

    it('returns true when the contents are null & stat.isDirectory is true', function(done) {
      var file = new File({ contents: null, stat: fakeStat });
      expect(file.isDirectory()).toEqual(true);
      done();
    });

    it('returns false when stat exists but does not contain an isDirectory method', function(done) {
      var file = new File({ contents: null, stat: {} });
      expect(file.isDirectory()).toEqual(false);
      done();
    });

    it('returns false when stat does not exist', function(done) {
      var file = new File({ contents: null });
      expect(file.isDirectory()).toEqual(false);
      done();
    });
  });

  describe('isSymbolic()', function() {
    var fakeStat = {
      isSymbolicLink: function() {
        return true;
      },
    };

    it('returns false when the contents are a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val, stat: fakeStat });
      expect(file.isSymbolic()).toEqual(false);
      done();
    });

    it('returns false when the contents are a Stream', function(done) {
      var val = new Stream();
      var file = new File({ contents: val, stat: fakeStat });
      expect(file.isSymbolic()).toEqual(false);
      done();
    });

    it('returns true when the contents are null & stat.isSymbolicLink is true', function(done) {
      var file = new File({ contents: null, stat: fakeStat });
      expect(file.isSymbolic()).toEqual(true);
      done();
    });

    it('returns false when stat exists but does not contain an isSymbolicLink method', function(done) {
      var file = new File({ contents: null, stat: {} });
      expect(file.isSymbolic()).toEqual(false);
      done();
    });

    it('returns false when stat does not exist', function(done) {
      var file = new File({ contents: null });
      expect(file.isSymbolic()).toEqual(false);
      done();
    });
  });

  describe('clone()', function() {

    it('copies all attributes over with Buffer contents', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Buffer('test'),
      };
      var file = new File(options);
      var file2 = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.cwd).toEqual(file.cwd);
      expect(file2.base).toEqual(file.base);
      expect(file2.path).toEqual(file.path);
      expect(file2.contents).toNotBe(file.contents);
      expect(file2.contents.toString('utf8')).toEqual(file.contents.toString('utf8'));
      done();
    });

    it('assigns Buffer content reference when contents option is false', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test'),
      };
      var file = new File(options);

      var copy1 = file.clone({ contents: false });
      expect(copy1.contents).toBe(file.contents);

      var copy2 = file.clone();
      expect(copy2.contents).toNotBe(file.contents);

      var copy3 = file.clone({ contents: 'invalid' });
      expect(copy3.contents).toNotBe(file.contents);
      done();
    });

    it('copies all attributes over with Stream contents', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup']),
      };
      var file = new File(options);
      var file2 = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.cwd).toEqual(file.cwd);
      expect(file2.base).toEqual(file.base);
      expect(file2.path).toEqual(file.path);
      expect(file2.contents).toNotBe(file.contents);

      var ends = 2;
      var data = null;
      var data2 = null;

      function latch(err) {
        if (err) {
          done(err);
          return;
        }

        if (--ends === 0) {
          expect(data).toNotBe(data2);
          expect(data.toString('utf8')).toEqual(data2.toString('utf8'));
          done();
        }
      }

      pipe([
        file.contents,
        concat(function(d) {
          data = d;
        }),
      ], latch);

      pipe([
        file2.contents,
        concat(function(d) {
          data2 = d;
        }),
      ], latch);
    });

    it('does not start flowing until all clones flows', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup']),
      };
      var file = new File(options);
      var file2 = file.clone();
      var ends = 2;

      var data = '';
      var data2 = '';

      function latch() {
        if (--ends === 0) {
          expect(data).toEqual(data2);
          done();
        }
      }

      // Start flowing file2
      file2.contents.on('data', function(chunk) {
        data2 += chunk.toString('utf8');
      });

      process.nextTick(function() {
        // Nothing was written yet
        expect(data).toEqual('');
        expect(data2).toEqual('');

        // Starts flowing file
        file.contents.on('data', function(chunk) {
          data += chunk.toString('utf8');
        });
      });

      file2.contents.on('end', latch);
      file.contents.on('end', latch);
    });

    it('should not start flowing until all clones flows', function(done) {
      var contents = new Stream.PassThrough();
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: contents,
      };
      var file = new File(options);
      var file2 = file.clone();
      var ends = 2;

      function latch() {
        if (--ends === 0) {
          done();
        }
      }

      contents.write(new Buffer('wa'));

      process.nextTick(function() {
        contents.write(new Buffer('dup'));
        contents.end();
      });

      // Start flowing file2
      file2.contents.on('readable', function() {
        this.read();
      });

      process.nextTick(function() {
        // Starts flowing file
        file.contents.on('readable', function() {
          ends.should.equal(2);
        });
      });

      file2.contents.on('end', latch);
      file.contents.on('end', latch);
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
      file.inspect().should.equal('<File "test.coffee" <CloneableStream>>');
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

    it('should wrap Stream in Cloneable', function(done) {
      var val = new Stream();
      var file = new File();
      file.contents = val;
      (typeof file.contents.clone).should.equal('function');
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
