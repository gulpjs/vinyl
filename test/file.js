'use strict';

var fs = require('fs');
var path = require('path');
var expect = require('expect');
var Stream = require('readable-stream');
var miss = require('mississippi');
var cloneable = require('cloneable-readable');

var File = require('../');

var should = require('should');

var pipe = miss.pipe;
var from = miss.from;
var concat = miss.concat;
var isCloneable = cloneable.isCloneable;

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

      function assert(err) {
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
      ], assert);

      pipe([
        file2.contents,
        concat(function(d) {
          data2 = d;
        }),
      ], assert);
    });

    it('does not start flowing until all clones flows (data)', function(done) {
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

      function assert() {
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

      file2.contents.on('end', assert);
      file.contents.on('end', assert);
    });

    it('does not start flowing until all clones flows (readable)', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup']),
      };
      var file = new File(options);
      var file2 = file.clone();

      var data2 = '';

      function assert(data) {
        expect(data.toString('utf8')).toEqual(data2);
      }

      // Start flowing file2
      file2.contents.on('readable', function() {
        var chunk;
        while ((chunk = this.read()) !== null) {
          data2 += chunk.toString();
        }
      });

      pipe([
        file.contents,
        concat(assert),
      ], done);
    });

    it('copies all attributes over with null contents', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      };
      var file = new File(options);
      var file2 = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.cwd).toEqual(file.cwd);
      expect(file2.base).toEqual(file.base);
      expect(file2.path).toEqual(file.path);
      expect(file2.contents).toNotExist();
      done();
    });

    it('properly clones the `stat` property', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test'),
        stat: fs.statSync(__filename),
      };

      var file = new File(options);
      var copy = file.clone();

      expect(copy.stat.isFile()).toEqual(true);
      expect(copy.stat.isDirectory()).toEqual(false);
      expect(file.stat).toBeAn(fs.Stats);
      expect(copy.stat).toBeAn(fs.Stats);
      done();
    });

    it('properly clones the `history` property', function(done) {
      var options = {
        cwd: path.normalize('/'),
        base: path.normalize('/test/'),
        path: path.normalize('/test/test.js'),
        contents: new Buffer('test'),
      };

      var file = new File(options);
      var copy = file.clone();

      expect(copy.history[0]).toEqual(options.path);
      copy.path = 'lol';
      expect(file.path).toNotEqual(copy.path);
      done();
    });

    it('copies custom properties', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
        custom: { meta: {} },
      };

      var file = new File(options);
      var file2 = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.cwd).toEqual(file.cwd);
      expect(file2.base).toEqual(file.base);
      expect(file2.path).toEqual(file.path);
      expect(file2.custom).toNotBe(file.custom);
      expect(file2.custom.meta).toNotBe(file.custom.meta);
      expect(file2.custom).toEqual(file.custom);
      done();
    });

    it('copies history', function(done) {
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

      expect(file2.history).toEqual(history);
      expect(file2.history).toNotBe(file.history);
      expect(file2.path).toEqual(history[2]);
      done();
    });

    it('supports deep & shallow copy of all attributes', function(done) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
        custom: { meta: {} },
      };

      var file = new File(options);

      var file2 = file.clone();
      expect(file2.custom).toEqual(file.custom);
      expect(file2.custom).toNotBe(file.custom);
      expect(file2.custom.meta).toEqual(file.custom.meta);
      expect(file2.custom.meta).toNotBe(file.custom.meta);

      var file3 = file.clone(true);
      expect(file3.custom).toEqual(file.custom);
      expect(file3.custom).toNotBe(file.custom);
      expect(file3.custom.meta).toEqual(file.custom.meta);
      expect(file3.custom.meta).toNotBe(file.custom.meta);

      var file4 = file.clone({ deep: true });
      expect(file4.custom).toEqual(file.custom);
      expect(file4.custom).toNotBe(file.custom);
      expect(file4.custom.meta).toEqual(file.custom.meta);
      expect(file4.custom.meta).toNotBe(file.custom.meta);

      var file5 = file.clone(false);
      expect(file5.custom).toEqual(file.custom);
      expect(file5.custom).toBe(file.custom);
      expect(file5.custom.meta).toEqual(file.custom.meta);
      expect(file5.custom.meta).toBe(file.custom.meta);

      var file6 = file.clone({ deep: false });
      expect(file6.custom).toEqual(file.custom);
      expect(file6.custom).toBe(file.custom);
      expect(file6.custom.meta).toEqual(file.custom.meta);
      expect(file6.custom.meta).toBe(file.custom.meta);

      done();
    });

    it('supports inheritance', function(done) {
      function ExtendedFile() {
        File.apply(this, arguments);
      }
      ExtendedFile.prototype = Object.create(File.prototype);
      ExtendedFile.prototype.constructor = ExtendedFile;
      // Just copy static stuff since Object.setPrototypeOf is node >=0.12
      Object.keys(File).forEach(function(key) {
        ExtendedFile[key] = File[key];
      });

      var file = new ExtendedFile();
      var file2 = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.constructor).toBe(ExtendedFile);
      expect(file2).toBeAn(ExtendedFile);
      expect(file2).toBeA(File);
      expect(ExtendedFile.prototype.isPrototypeOf(file2)).toEqual(true);
      expect(File.prototype.isPrototypeOf(file2)).toEqual(true);
      done();
    });
  });

  describe('inspect()', function() {

    it('returns correct format when no contents and no path', function(done) {
      var file = new File();
      expect(file.inspect()).toEqual('<File >');
      done();
    });

    it('returns correct format when Buffer contents and no path', function(done) {
      var val = new Buffer('test');
      var file = new File({ contents: val });
      expect(file.inspect()).toEqual('<File <Buffer 74 65 73 74>>');
      done();
    });

    it('returns correct format when Buffer contents and relative path', function(done) {
      var val = new Buffer('test');
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: val,
      });
      expect(file.inspect()).toEqual('<File "test.coffee" <Buffer 74 65 73 74>>');
      done();
    });

    it('returns correct format when Stream contents and relative path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from([]),
      });
      expect(file.inspect()).toEqual('<File "test.coffee" <CloneableStream>>');
      done();
    });

    it('returns correct format when null contents and relative path', function(done) {
      var file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      });
      expect(file.inspect()).toEqual('<File "test.coffee">');
      done();
    });
  });

  describe('contents get/set', function() {

    it('returns _contents', function(done) {
      var val = new Buffer('test');
      var file = new File();
      file._contents = val;
      expect(file.contents).toEqual(val);
      done();
    });

    it('sets _contents', function(done) {
      var val = new Buffer('test');
      var file = new File();
      file.contents = val;
      expect(file._contents).toEqual(val);
      done();
    });

    it('sets a Buffer', function(done) {
      var val = new Buffer('test');
      var file = new File();
      file.contents = val;
      expect(file.contents).toEqual(val);
      done();
    });

    it('wraps Stream in Cloneable', function(done) {
      var val = from([]);
      var file = new File();
      file.contents = val;
      expect(isCloneable(file.contents)).toEqual(true);
      done();
    });

    it('does not double wrap a Cloneable', function(done) {
      var val = from([]);
      var clone = cloneable(val);
      var file = new File();
      file.contents = clone;
      expect(file.contents._original).toBe(val);
      done();
    });

    it('sets null', function(done) {
      var val = null;
      var file = new File();
      file.contents = val;
      expect(file.contents).toEqual(null);
      done();
    });

    it('does not set a string', function(done) {
      var val = 'test';
      var file = new File();
      function invalid() {
        file.contents = val;
      }
      expect(invalid).toThrow();
      done();
    });
  });

  describe('cwd get/set', function() {

    it('returns _cwd', function(done) {
      var val = '/test';
      var file = new File();
      file._cwd = val;
      expect(file.cwd).toEqual(val);
      done();
    });

    it('sets _cwd', function(done) {
      var val = '/test';
      var file = new File();
      file.cwd = val;
      expect(file._cwd).toEqual(path.normalize(val));
      done();
    });

    it('normalizes and removes trailing separator on set', function(done) {
      var val = '/test/foo/../foo/';
      var expected = path.normalize(val.slice(0, -1));
      var file = new File();

      file.cwd = val;

      expect(file.cwd).toEqual(expected);

      var val2 = '\\test\\foo\\..\\foo\\';
      var expected2 = path.normalize(val2.slice(0, -1));

      file.cwd = val2;

      expect(file.cwd).toEqual(expected2);
      done();
    });

    it('throws on set with invalid values', function(done) {
      var invalidValues = [
        '',
        null,
        undefined,
        true,
        false,
        0,
        Infinity,
        NaN,
        {},
        [],
      ];
      var file = new File();

      invalidValues.forEach(function(val) {
        function invalid() {
          file.cwd = val;
        }
        expect(invalid).toThrow('cwd must be a non-empty string.');
      });

      done();
    });
  });

  describe('base get/set', function() {

    it('proxies cwd when omitted', function(done) {
      var file = new File({ cwd: '/test' });
      expect(file.base).toEqual(file.cwd);
      done();
    });

    it('proxies cwd when same', function(done) {
      var file = new File({
        cwd: '/test',
        base: '/test',
      });
      file.cwd = '/foo/';
      expect(file.base).toEqual(file.cwd);

      var file2 = new File({
        cwd: '/test',
      });
      file2.base = '/test/';
      file2.cwd = '/foo/';
      expect(file2.base).toEqual(file.cwd);
      done();
    });

    it('proxies to cwd when null or undefined', function(done) {
      var file = new File({
        cwd: '/foo',
        base: '/bar',
      });
      expect(file.base).toNotEqual(file.cwd);
      file.base = null;
      expect(file.base).toEqual(file.cwd);
      file.base = '/bar/';
      expect(file.base).toNotEqual(file.cwd);
      file.base = undefined;
      expect(file.base).toEqual(file.cwd);
      done();
    });

    it('returns _base', function(done) {
      var val = '/test/';
      var file = new File();
      file._base = val;
      expect(file.base).toEqual(val);
      done();
    });

    it('sets _base', function(done) {
      var val = '/test/foo';
      var file = new File();
      file.base = val;
      expect(file._base).toEqual(path.normalize(val));
      done();
    });

    it('normalizes and removes trailing separator on set', function(done) {
      var val = '/test/foo/../foo/';
      var expected = path.normalize(val.slice(0, -1));
      var file = new File();

      file.base = val;

      expect(file.base).toEqual(expected);

      var val2 = '\\test\\foo\\..\\foo\\';
      var expected2 = path.normalize(val2.slice(0, -1));

      file.base = val2;

      expect(file.base).toEqual(expected2);
      done();
    });

    it('throws on set with invalid values', function(done) {
      var invalidValues = [
        true,
        false,
        1,
        0,
        Infinity,
        NaN,
        '',
        {},
        [],
      ];
      var file = new File();

      invalidValues.forEach(function(val) {
        function invalid() {
          file.base = val;
        }
        expect(invalid).toThrow('base must be a non-empty string, or null/undefined.');
      });

      done();
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
