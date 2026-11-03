"use strict";

var fs = require("node:fs");
var path = require("node:path");
var util = require("node:util");
var assert = require("node:assert");
var { describe, it } = require("node:test");

var File = require("../");

var isWin = process.platform === "win32";

function suite(moduleName) {
  var stream = require(moduleName);

  function concat(fn, timeout) {
    var items = [];
    return new stream.Writable({
      objectMode: true,
      write: function (chunk, enc, cb) {
        if (typeof enc === "function") {
          cb = enc;
        }
        setTimeout(function () {
          items.push(chunk);
          cb();
        }, timeout || 1);
      },
      final: function (cb) {
        if (typeof fn === "function") {
          fn(items);
        }

        cb();
      },
    });
  }

  describe("File (" + moduleName + ")", function () {
    describe("isVinyl()", function () {
      it("returns true for a Vinyl object", function () {
        var file = new File();
        var result = File.isVinyl(file);
        assert.strictEqual(result, true);
      });

      it("returns false for a normal object", function () {
        var result = File.isVinyl({});
        assert.strictEqual(result, false);
      });

      it("returns false for null", function () {
        var result = File.isVinyl(null);
        assert.strictEqual(result, false);
      });

      it("returns false for a string", function () {
        var result = File.isVinyl("foobar");
        assert.strictEqual(result, false);
      });

      it("returns false for a String object", function () {
        var result = File.isVinyl(new String("foobar"));
        assert.strictEqual(result, false);
      });

      it("returns false for a number", function () {
        var result = File.isVinyl(1);
        assert.strictEqual(result, false);
      });

      it("returns false for a Number object", function () {
        var result = File.isVinyl(new Number(1));
        assert.strictEqual(result, false);
      });

      // This is based on current implementation
      // A test was added to document and make aware during internal changes
      // TODO: decide if this should be leak-able
      it("returns true for a mocked object", function () {
        var result = File.isVinyl({ _isVinyl: true });
        assert.strictEqual(result, true);
      });
    });

    describe("defaults", function () {
      it("defaults cwd to process.cwd", function () {
        var file = new File();
        assert.strictEqual(file.cwd, process.cwd());
      });

      it("defaults base to process.cwd", function () {
        var file = new File();
        assert.strictEqual(file.base, process.cwd());
      });

      it("defaults base to cwd property", function () {
        var cwd = path.normalize("/");
        var file = new File({ cwd: cwd });
        assert.strictEqual(file.base, cwd);
      });

      it("defaults path to null", function () {
        var file = new File();
        assert.strictEqual(file.path, null);
      });

      it("defaults history to an empty array", function () {
        var file = new File();
        assert.deepStrictEqual(file.history, []);
      });

      it("defaults stat to null", function () {
        var file = new File();
        assert.strictEqual(file.stat, null);
      });

      it("defaults contents to null", function () {
        var file = new File();
        assert.strictEqual(file.contents, null);
      });
    });

    describe("constructor()", function () {
      it("sets base", function () {
        var val = path.normalize("/");
        var file = new File({ base: val });
        assert.strictEqual(file.base, val);
      });

      it("sets cwd", function () {
        var val = path.normalize("/");
        var file = new File({ cwd: val });
        assert.strictEqual(file.cwd, val);
      });

      it("sets path (and history)", function () {
        var val = path.normalize("/test.coffee");
        var file = new File({ path: val });
        assert.strictEqual(file.path, val);
        assert.deepStrictEqual(file.history, [val]);
      });

      it("sets history (and path)", function () {
        var val = path.normalize("/test.coffee");
        var file = new File({ history: [val] });
        assert.strictEqual(file.path, val);
        assert.deepStrictEqual(file.history, [val]);
      });

      it("sets stat", function () {
        var val = {};
        var file = new File({ stat: val });
        assert.strictEqual(file.stat, val);
      });

      it("sets contents", function () {
        var val = Buffer.from("test");
        var file = new File({ contents: val });
        assert.strictEqual(file.contents, val);
      });

      it("sets custom properties", function () {
        var sourceMap = {};
        var file = new File({ sourceMap: sourceMap });
        assert.deepStrictEqual(file.sourceMap, sourceMap);
      });

      it("normalizes path", function () {
        var val = "/test/foo/../test.coffee";
        var expected = path.normalize(val);
        var file = new File({ path: val });
        assert.strictEqual(file.path, expected);
        assert.deepStrictEqual(file.history, [expected]);
      });

      it("normalizes and removes trailing separator from path", function () {
        var val = "/test/foo/../foo/";
        var expected = path.normalize(val.slice(0, -1));
        var file = new File({ path: val });
        assert.strictEqual(file.path, expected);
      });

      it("normalizes history", function () {
        var val = ["/test/bar/../bar/test.coffee", "/test/foo/../test.coffee"];
        var expected = val.map(function (p) {
          return path.normalize(p);
        });
        var file = new File({ history: val });
        assert.strictEqual(file.path, expected[1]);
        assert.deepStrictEqual(file.history, expected);
      });

      it("normalizes and removes trailing separator from history", function () {
        var val = ["/test/foo/../foo/", "/test/bar/../bar/"];
        var expected = val.map(function (p) {
          return path.normalize(p.slice(0, -1));
        });
        var file = new File({ history: val });
        assert.deepStrictEqual(file.history, expected);
      });

      it("appends path to history if both exist and different from last", function () {
        var val = path.normalize("/test/baz/test.coffee");
        var history = [
          path.normalize("/test/bar/test.coffee"),
          path.normalize("/test/foo/test.coffee"),
        ];
        var file = new File({ path: val, history: history });

        var expectedHistory = history.concat(val);

        assert.strictEqual(file.path, val);
        assert.deepStrictEqual(file.history, expectedHistory);
      });

      it("does not append path to history if both exist and same as last", function () {
        var val = path.normalize("/test/baz/test.coffee");
        var history = [
          path.normalize("/test/bar/test.coffee"),
          path.normalize("/test/foo/test.coffee"),
          val,
        ];
        var file = new File({ path: val, history: history });

        assert.strictEqual(file.path, val);
        assert.deepStrictEqual(file.history, history);
      });

      it("does not mutate history array passed in", function () {
        var val = path.normalize("/test/baz/test.coffee");
        var history = [
          path.normalize("/test/bar/test.coffee"),
          path.normalize("/test/foo/test.coffee"),
        ];
        var historyCopy = Array.prototype.slice.call(history);
        var file = new File({ path: val, history: history });

        var expectedHistory = history.concat(val);

        assert.strictEqual(file.path, val);
        assert.deepStrictEqual(file.history, expectedHistory);
        assert.deepStrictEqual(history, historyCopy);
      });
    });

    describe("isBuffer()", function () {
      it("returns true when the contents are a Buffer", function () {
        var val = Buffer.from("test");
        var file = new File({ contents: val });
        assert.strictEqual(file.isBuffer(), true);
      });

      it("returns false when the contents are a Stream", function () {
        var val = stream.Readable.from([]);
        var file = new File({ contents: val });
        assert.strictEqual(file.isBuffer(), false);
      });

      it("returns false when the contents are null", function () {
        var file = new File({ contents: null });
        assert.strictEqual(file.isBuffer(), false);
      });
    });

    describe("isStream()", function () {
      it("returns false when the contents are a Buffer", function () {
        var val = Buffer.from("test");
        var file = new File({ contents: val });
        assert.strictEqual(file.isStream(), false);
      });

      it("returns true when the contents are a Stream", function () {
        var val = stream.Readable.from([]);
        var file = new File({ contents: val });
        assert.strictEqual(file.isStream(), true);
      });

      it("returns false when the contents are null", function () {
        var file = new File({ contents: null });
        assert.strictEqual(file.isStream(), false);
      });
    });

    describe("isNull()", function () {
      it("returns false when the contents are a Buffer", function () {
        var val = Buffer.from("test");
        var file = new File({ contents: val });
        assert.strictEqual(file.isNull(), false);
      });

      it("returns false when the contents are a Stream", function () {
        var val = stream.Readable.from([]);
        var file = new File({ contents: val });
        assert.strictEqual(file.isNull(), false);
      });

      it("returns true when the contents are null", function () {
        var file = new File({ contents: null });
        assert.strictEqual(file.isNull(), true);
      });
    });

    describe("isDirectory()", function () {
      var fakeStat = {
        isDirectory: function () {
          return true;
        },
      };

      it("returns false when the contents are a Buffer", function () {
        var val = Buffer.from("test");
        var file = new File({ contents: val, stat: fakeStat });
        assert.strictEqual(file.isDirectory(), false);
      });

      it("returns false when the contents are a Stream", function () {
        var val = stream.Readable.from([]);
        var file = new File({ contents: val, stat: fakeStat });
        assert.strictEqual(file.isDirectory(), false);
      });

      it("returns true when the contents are null & stat.isDirectory is true", function () {
        var file = new File({ contents: null, stat: fakeStat });
        assert.strictEqual(file.isDirectory(), true);
      });

      it("returns false when stat exists but does not contain an isDirectory method", function () {
        var file = new File({ contents: null, stat: {} });
        assert.strictEqual(file.isDirectory(), false);
      });

      it("returns false when stat does not exist", function () {
        var file = new File({ contents: null });
        assert.strictEqual(file.isDirectory(), false);
      });
    });

    describe("isSymbolic()", function () {
      var fakeStat = {
        isSymbolicLink: function () {
          return true;
        },
      };

      it("returns false when the contents are a Buffer", function () {
        var val = Buffer.from("test");
        var file = new File({ contents: val, stat: fakeStat });
        assert.strictEqual(file.isSymbolic(), false);
      });

      it("returns false when the contents are a Stream", function () {
        var val = stream.Readable.from([]);
        var file = new File({ contents: val, stat: fakeStat });
        assert.strictEqual(file.isSymbolic(), false);
      });

      it("returns true when the contents are null & stat.isSymbolicLink is true", function () {
        var file = new File({ contents: null, stat: fakeStat });
        assert.strictEqual(file.isSymbolic(), true);
      });

      it("returns false when stat exists but does not contain an isSymbolicLink method", function () {
        var file = new File({ contents: null, stat: {} });
        assert.strictEqual(file.isSymbolic(), false);
      });

      it("returns false when stat does not exist", function () {
        var file = new File({ contents: null });
        assert.strictEqual(file.isSymbolic(), false);
      });
    });

    describe("clone()", function () {
      var fakeStat = {
        isSymbolicLink: function () {
          return true;
        },
      };

      it("copies all attributes over with Buffer contents", function () {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: Buffer.from("test"),
        };
        var file = new File(options);
        var file2 = file.clone();

        assert.notStrictEqual(file2, file);
        assert.strictEqual(file2.cwd, file.cwd);
        assert.strictEqual(file2.base, file.base);
        assert.strictEqual(file2.path, file.path);
        assert.notStrictEqual(file2.contents, file.contents);
        assert.strictEqual(
          file2.contents.toString("utf8"),
          file.contents.toString("utf8"),
        );
      });

      it("assigns Buffer content reference when contents option is false", function () {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.js",
          contents: Buffer.from("test"),
        };
        var file = new File(options);

        var copy1 = file.clone({ contents: false });
        assert.strictEqual(copy1.contents, file.contents);

        var copy2 = file.clone();
        assert.notStrictEqual(copy2.contents, file.contents);

        var copy3 = file.clone({ contents: "invalid" });
        assert.notStrictEqual(copy3.contents, file.contents);
      });

      it("copies all attributes over with Stream contents", function (t, done) {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: stream.Readable.from(["wa", "dup"]),
        };
        var file = new File(options);
        var file2 = file.clone();

        assert.notStrictEqual(file2, file);
        assert.strictEqual(file2.cwd, file.cwd);
        assert.strictEqual(file2.base, file.base);
        assert.strictEqual(file2.path, file.path);
        assert.notStrictEqual(file2.contents, file.contents);

        var ends = 2;
        var data = null;
        var data2 = null;

        function assertion(err) {
          if (err) {
            done(err);
            return;
          }

          if (--ends === 0) {
            assert.notStrictEqual(data, data2);
            assert.strictEqual(data.join(""), data2.join(""));
            done();
          }
        }

        stream.pipeline(
          [
            file.contents,
            concat(function (d) {
              data = d;
            }),
          ],
          assertion,
        );

        stream.pipeline(
          [
            file2.contents,
            concat(function (d) {
              data2 = d;
            }),
          ],
          assertion,
        );
      });

      it("does not lose data even when clones flow differently (data)", function (t, done) {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: stream.Readable.from(["wa", "dup"]),
        };
        var file = new File(options);
        var file2 = file.clone();
        var ends = 2;

        var data = "";
        var data2 = "";

        function assertion() {
          if (--ends === 0) {
            assert.strictEqual(data, "wadup");
            assert.strictEqual(data2, "wadup");
            done();
          }
        }

        // Start flowing file2
        file2.contents.on("data", function (chunk) {
          data2 += chunk.toString("utf8");
        });

        process.nextTick(function () {
          // Starts flowing file
          file.contents.on("data", function (chunk) {
            data += chunk.toString("utf8");
          });
        });

        file2.contents.on("end", assertion);
        file.contents.on("end", assertion);
      });

      it("does not lose data even when clones flow differently (readable & pipe)", function (t, done) {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: stream.Readable.from(["wa", "dup"]),
        };
        var file = new File(options);
        var file2 = file.clone();

        var data2 = "";

        function assertion(data) {
          assert.strictEqual(data.join(""), "wadup");
          assert.strictEqual(data2, "wadup");
        }

        // Start flowing file2
        file2.contents.on("readable", function () {
          var chunk;
          while ((chunk = this.read()) !== null) {
            data2 += chunk.toString();
          }
        });

        // Pipe file1
        stream.pipeline([file.contents, concat(assertion)], done);
      });

      it("fixes file.symlink if file is a symbolic link", function () {
        var val = "/test/test.js";
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          content: null,
          stat: fakeStat,
          symlink: val,
        };
        var file = new File(options);
        var file2 = file.clone();

        assert.notStrictEqual(file2, file);
        assert.strictEqual(file2.symlink, file.symlink);
      });

      it("copies all attributes over with null contents", function () {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: null,
        };
        var file = new File(options);
        var file2 = file.clone();

        assert.notStrictEqual(file2, file);
        assert.strictEqual(file2.cwd, file.cwd);
        assert.strictEqual(file2.base, file.base);
        assert.strictEqual(file2.path, file.path);
        assert.strictEqual(file2.contents, null);
      });

      it("properly clones the `stat` property", function () {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.js",
          contents: Buffer.from("test"),
          stat: fs.statSync(__filename),
        };

        var file = new File(options);
        var copy = file.clone();

        assert.strictEqual(copy.stat.isFile(), true);
        assert.strictEqual(copy.stat.isDirectory(), false);
        assert.ok(file.stat instanceof fs.Stats);
        assert.ok(copy.stat instanceof fs.Stats);
      });

      it("properly clones the `history` property", function () {
        var options = {
          cwd: path.normalize("/"),
          base: path.normalize("/test/"),
          path: path.normalize("/test/test.js"),
          contents: Buffer.from("test"),
        };

        var file = new File(options);
        var copy = file.clone();

        assert.strictEqual(copy.history[0], options.path);
        copy.path = "lol";
        assert.notStrictEqual(file.path, copy.path);
      });

      it("copies custom properties", function () {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: null,
          custom: { meta: {} },
        };

        var file = new File(options);
        var file2 = file.clone();

        assert.notStrictEqual(file2, file);
        assert.strictEqual(file2.cwd, file.cwd);
        assert.strictEqual(file2.base, file.base);
        assert.strictEqual(file2.path, file.path);
        assert.notStrictEqual(file2.custom, file.custom);
        assert.notStrictEqual(file2.custom.meta, file.custom.meta);
        assert.deepStrictEqual(file2.custom, file.custom);
      });

      it("copies history", function () {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: null,
        };
        var history = [
          path.normalize("/test/test.coffee"),
          path.normalize("/test/test.js"),
          path.normalize("/test/test-938di2s.js"),
        ];

        var file = new File(options);
        file.path = history[1];
        file.path = history[2];
        var file2 = file.clone();

        assert.deepStrictEqual(file2.history, history);
        assert.notStrictEqual(file2.history, file.history);
        assert.strictEqual(file2.path, history[2]);
      });

      it("supports deep & shallow copy of all attributes", function () {
        var options = {
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: null,
          custom: { meta: {} },
        };

        var file = new File(options);

        var file2 = file.clone();
        assert.deepStrictEqual(file2.custom, file.custom);
        assert.notStrictEqual(file2.custom, file.custom);
        assert.deepStrictEqual(file2.custom.meta, file.custom.meta);
        assert.notStrictEqual(file2.custom.meta, file.custom.meta);

        var file3 = file.clone(true);
        assert.deepStrictEqual(file3.custom, file.custom);
        assert.notStrictEqual(file3.custom, file.custom);
        assert.deepStrictEqual(file3.custom.meta, file.custom.meta);
        assert.notStrictEqual(file3.custom.meta, file.custom.meta);

        var file4 = file.clone({ deep: true });
        assert.deepStrictEqual(file4.custom, file.custom);
        assert.notStrictEqual(file4.custom, file.custom);
        assert.deepStrictEqual(file4.custom.meta, file.custom.meta);
        assert.notStrictEqual(file4.custom.meta, file.custom.meta);

        var file5 = file.clone(false);
        assert.deepStrictEqual(file5.custom, file.custom);
        assert.strictEqual(file5.custom, file.custom);
        assert.deepStrictEqual(file5.custom.meta, file.custom.meta);
        assert.strictEqual(file5.custom.meta, file.custom.meta);

        var file6 = file.clone({ deep: false });
        assert.deepStrictEqual(file6.custom, file.custom);
        assert.strictEqual(file6.custom, file.custom);
        assert.deepStrictEqual(file6.custom.meta, file.custom.meta);
        assert.strictEqual(file6.custom.meta, file.custom.meta);
      });

      it("supports inheritance", function () {
        function ExtendedFile() {
          File.apply(this, arguments);
        }
        ExtendedFile.prototype = Object.create(File.prototype);
        ExtendedFile.prototype.constructor = ExtendedFile;
        // Just copy static stuff since Object.setPrototypeOf is node >=0.12
        Object.keys(File).forEach(function (key) {
          ExtendedFile[key] = File[key];
        });

        var file = new ExtendedFile();
        var file2 = file.clone();

        assert.notStrictEqual(file2, file);
        assert.strictEqual(file2.constructor, ExtendedFile);
        assert.ok(file2 instanceof ExtendedFile);
        assert.ok(file2 instanceof File);
        assert.strictEqual(
          Object.prototype.isPrototypeOf.call(ExtendedFile.prototype, file2),
          true,
        );
        assert.strictEqual(
          Object.prototype.isPrototypeOf.call(File.prototype, file2),
          true,
        );
      });
    });

    describe("inspect()", function () {
      it("returns correct format when no contents and no path", function () {
        var file = new File();
        var expectation = "<File >";
        assert.strictEqual(util.inspect(file), expectation);
      });

      it("returns correct format when Buffer contents and no path", function () {
        var val = Buffer.from("test");
        var file = new File({ contents: val });
        assert.strictEqual(util.inspect(file), "<File <Buffer 74 65 73 74>>");
      });

      it("returns correct format when Buffer contents and relative path", function () {
        var val = Buffer.from("test");
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: val,
        });
        assert.strictEqual(
          util.inspect(file),
          '<File "test.coffee" <Buffer 74 65 73 74>>',
        );
      });

      it("returns correct format when Stream contents and relative path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: stream.Readable.from([]),
        });
        assert.strictEqual(
          util.inspect(file),
          '<File "test.coffee" <ReadableStream>>',
        );
      });

      it("returns correct format when null contents and relative path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
          contents: null,
        });
        assert.strictEqual(util.inspect(file), '<File "test.coffee">');
      });
    });

    describe("contents get/set", function () {
      it("returns _contents", function () {
        var val = Buffer.from("test");
        var file = new File();
        file._contents = val;
        assert.strictEqual(file.contents, val);
      });

      it("sets _contents", function () {
        var val = Buffer.from("test");
        var file = new File();
        file.contents = val;
        assert.strictEqual(file._contents, val);
      });

      it("sets a Buffer", function () {
        var val = Buffer.from("test");
        var file = new File();
        file.contents = val;
        assert.strictEqual(file.contents, val);
      });

      it("sets null", function () {
        var val = null;
        var file = new File();
        file.contents = val;
        assert.strictEqual(file.contents, null);
      });

      it("does not set a string", function () {
        var val = "test";
        var file = new File();
        function invalid() {
          file.contents = val;
        }
        assert.throws(invalid);
      });
    });

    describe("cwd get/set", function () {
      it("returns _cwd", function () {
        var val = "/test";
        var file = new File();
        file._cwd = val;
        assert.strictEqual(file.cwd, val);
      });

      it("sets _cwd", function () {
        var val = "/test";
        var file = new File();
        file.cwd = val;
        assert.strictEqual(file._cwd, path.normalize(val));
      });

      it("normalizes and removes trailing separator on set", function () {
        var val = "/test/foo/../foo/";
        var expected = path.normalize(val.slice(0, -1));
        var file = new File();

        file.cwd = val;

        assert.strictEqual(file.cwd, expected);

        var val2 = "\\test\\foo\\..\\foo\\";
        var expected2 = path.normalize(isWin ? val2.slice(0, -1) : val2);

        file.cwd = val2;

        assert.strictEqual(file.cwd, expected2);
      });

      it("throws on set with invalid values", function () {
        var invalidValues = [
          "",
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

        invalidValues.forEach(function (val) {
          function invalid() {
            file.cwd = val;
          }
          assert.throws(invalid, {
            message: "cwd must be a non-empty string.",
          });
        });
      });
    });

    describe("base get/set", function () {
      it("proxies cwd when omitted", function () {
        var file = new File({ cwd: "/test" });
        assert.strictEqual(file.base, file.cwd);
      });

      it("proxies cwd when same", function () {
        var file = new File({
          cwd: "/test",
          base: "/test",
        });
        file.cwd = "/foo/";
        assert.strictEqual(file.base, file.cwd);

        var file2 = new File({
          cwd: "/test",
        });
        file2.base = "/test/";
        file2.cwd = "/foo/";
        assert.strictEqual(file2.base, file.cwd);
      });

      it("proxies to cwd when set to same value", function () {
        var file = new File({
          cwd: "/foo",
          base: "/bar",
        });
        assert.notStrictEqual(file.base, file.cwd);
        file.base = file.cwd;
        assert.strictEqual(file.base, file.cwd);
      });

      it("proxies to cwd when null or undefined", function () {
        var file = new File({
          cwd: "/foo",
          base: "/bar",
        });
        assert.notStrictEqual(file.base, file.cwd);
        file.base = null;
        assert.strictEqual(file.base, file.cwd);
        file.base = "/bar/";
        assert.notStrictEqual(file.base, file.cwd);
        file.base = undefined;
        assert.strictEqual(file.base, file.cwd);
      });

      it("returns _base", function () {
        var val = "/test/";
        var file = new File();
        file._base = val;
        assert.strictEqual(file.base, val);
      });

      it("sets _base", function () {
        var val = "/test/foo";
        var file = new File();
        file.base = val;
        assert.strictEqual(file._base, path.normalize(val));
      });

      it("normalizes and removes trailing separator on set", function () {
        var val = "/test/foo/../foo/";
        var expected = path.normalize(val.slice(0, -1));
        var file = new File();

        file.base = val;

        assert.strictEqual(file.base, expected);

        var val2 = "\\test\\foo\\..\\foo\\";
        var expected2 = path.normalize(isWin ? val2.slice(0, -1) : val2);

        file.base = val2;

        assert.strictEqual(file.base, expected2);
      });

      it("throws on set with invalid values", function () {
        var invalidValues = [true, false, 1, 0, Infinity, NaN, "", {}, []];
        var file = new File();

        invalidValues.forEach(function (val) {
          function invalid() {
            file.base = val;
          }
          assert.throws(invalid, {
            message: "base must be a non-empty string, or null/undefined.",
          });
        });
      });
    });

    describe("relative get/set", function () {
      it("throws on set", function () {
        var file = new File();

        function invalid() {
          file.relative = "test";
        }

        assert.throws(invalid, {
          message:
            "File.relative is generated from the base and path attributes. Do not modify it.",
        });
      });

      it("throws on get with no path", function () {
        var file = new File();

        function invalid() {
          file.relative;
        }

        assert.throws(invalid, {
          message: "No path specified! Can not get relative.",
        });
      });

      it("returns a relative path from base", function () {
        var file = new File({
          base: "/test/",
          path: "/test/test.coffee",
        });

        assert.strictEqual(file.relative, "test.coffee");
      });

      it("returns a relative path from cwd", function () {
        var file = new File({
          cwd: "/",
          path: "/test/test.coffee",
        });

        assert.strictEqual(file.relative, path.normalize("test/test.coffee"));
      });

      it("does not append separator when directory", function () {
        var file = new File({
          base: "/test",
          path: "/test/foo/bar",
          stat: {
            isDirectory: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.relative, path.normalize("foo/bar"));
      });

      it("does not append separator when symlink", function () {
        var file = new File({
          base: "/test",
          path: "/test/foo/bar",
          stat: {
            isSymbolicLink: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.relative, path.normalize("foo/bar"));
      });

      it("does not append separator when directory & symlink", function () {
        var file = new File({
          base: "/test",
          path: "/test/foo/bar",
          stat: {
            isDirectory: function () {
              return true;
            },
            isSymbolicLink: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.relative, path.normalize("foo/bar"));
      });
    });

    describe("dirname get/set", function () {
      it("throws on get with no path", function () {
        var file = new File();

        function invalid() {
          file.dirname;
        }

        assert.throws(invalid, {
          message: "No path specified! Can not get dirname.",
        });
      });

      it("returns the dirname without trailing separator", function () {
        var file = new File({
          cwd: "/",
          base: "/test",
          path: "/test/test.coffee",
        });

        assert.strictEqual(file.dirname, path.normalize("/test"));
      });

      it("throws on set with no path", function () {
        var file = new File();

        function invalid() {
          file.dirname = "/test";
        }

        assert.throws(invalid, {
          message: "No path specified! Can not set dirname.",
        });
      });

      it("replaces the dirname of the path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
        });

        file.dirname = "/test/foo";
        assert.strictEqual(file.path, path.normalize("/test/foo/test.coffee"));
      });
    });

    describe("basename get/set", function () {
      it("throws on get with no path", function () {
        var file = new File();

        function invalid() {
          file.basename;
        }

        assert.throws(invalid, {
          message: "No path specified! Can not get basename.",
        });
      });

      it("returns the basename of the path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
        });

        assert.strictEqual(file.basename, "test.coffee");
      });

      it("does not append trailing separator when directory", function () {
        var file = new File({
          path: "/test/foo",
          stat: {
            isDirectory: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.basename, "foo");
      });

      it("does not append trailing separator when symlink", function () {
        var file = new File({
          path: "/test/foo",
          stat: {
            isSymbolicLink: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.basename, "foo");
      });

      it("does not append trailing separator when directory & symlink", function () {
        var file = new File({
          path: "/test/foo",
          stat: {
            isDirectory: function () {
              return true;
            },
            isSymbolicLink: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.basename, "foo");
      });

      it("removes trailing separator", function () {
        var file = new File({
          path: "/test/foo/",
        });

        assert.strictEqual(file.basename, "foo");
      });

      it("removes trailing separator when directory", function () {
        var file = new File({
          path: "/test/foo/",
          stat: {
            isDirectory: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.basename, "foo");
      });

      it("removes trailing separator when symlink", function () {
        var file = new File({
          path: "/test/foo/",
          stat: {
            isSymbolicLink: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.basename, "foo");
      });

      it("removes trailing separator when directory & symlink", function () {
        var file = new File({
          path: "/test/foo/",
          stat: {
            isDirectory: function () {
              return true;
            },
            isSymbolicLink: function () {
              return true;
            },
          },
        });

        assert.strictEqual(file.basename, "foo");
      });

      it("throws on set with no path", function () {
        var file = new File();

        function invalid() {
          file.basename = "test.coffee";
        }

        assert.throws(invalid, {
          message: "No path specified! Can not set basename.",
        });
      });

      it("replaces the basename of the path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
        });

        file.basename = "foo.png";
        assert.strictEqual(file.path, path.normalize("/test/foo.png"));
      });
    });

    describe("stem get/set", function () {
      it("throws on get with no path", function () {
        var file = new File();

        function invalid() {
          file.stem;
        }

        assert.throws(invalid, {
          message: "No path specified! Can not get stem.",
        });
      });

      it("returns the stem of the path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
        });

        assert.strictEqual(file.stem, "test");
      });

      it("throws on set with no path", function () {
        var file = new File();

        function invalid() {
          file.stem = "test.coffee";
        }

        assert.throws(invalid, {
          message: "No path specified! Can not set stem.",
        });
      });

      it("replaces the stem of the path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
        });

        file.stem = "foo";
        assert.strictEqual(file.path, path.normalize("/test/foo.coffee"));
      });
    });

    describe("extname get/set", function () {
      it("throws on get with no path", function () {
        var file = new File();

        function invalid() {
          file.extname;
        }

        assert.throws(invalid, {
          message: "No path specified! Can not get extname.",
        });
      });

      it("returns the extname of the path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
        });

        assert.strictEqual(file.extname, ".coffee");
      });

      it("throws on set with no path", function () {
        var file = new File();

        function invalid() {
          file.extname = ".coffee";
        }

        assert.throws(invalid, {
          message: "No path specified! Can not set extname.",
        });
      });

      it("replaces the extname of the path", function () {
        var file = new File({
          cwd: "/",
          base: "/test/",
          path: "/test/test.coffee",
        });

        file.extname = ".png";
        assert.strictEqual(file.path, path.normalize("/test/test.png"));
      });
    });

    describe("path get/set", function () {
      it("records path in history upon instantiation", function () {
        var file = new File({
          cwd: "/",
          path: "/test/test.coffee",
        });
        var history = [path.normalize("/test/test.coffee")];

        assert.strictEqual(file.path, history[0]);
        assert.deepStrictEqual(file.history, history);
      });

      it("records path in history when set", function () {
        var val = path.normalize("/test/test.js");
        var file = new File({
          cwd: "/",
          path: "/test/test.coffee",
        });
        var history = [path.normalize("/test/test.coffee"), val];

        file.path = val;
        assert.strictEqual(file.path, val);
        assert.deepStrictEqual(file.history, history);

        var val2 = path.normalize("/test/test.es6");
        history.push(val2);

        file.path = val2;
        assert.strictEqual(file.path, val2);
        assert.deepStrictEqual(file.history, history);
      });

      it("does not record path in history when set to the current path", function () {
        var val = path.normalize("/test/test.coffee");
        var file = new File({
          cwd: "/",
          path: val,
        });
        var history = [val];

        file.path = val;
        file.path = val;
        assert.strictEqual(file.path, val);
        assert.deepStrictEqual(file.history, history);
      });

      it("does not record path in history when set to empty string", function () {
        var val = path.normalize("/test/test.coffee");
        var file = new File({
          cwd: "/",
          path: val,
        });
        var history = [val];

        file.path = "";
        assert.strictEqual(file.path, val);
        assert.deepStrictEqual(file.history, history);
      });

      it("throws on set with null path", function () {
        var file = new File();

        assert.strictEqual(file.path, null);
        assert.deepStrictEqual(file.history, []);

        function invalid() {
          file.path = null;
        }

        assert.throws(invalid, {
          message: "path should be a string.",
        });
      });

      it("normalizes the path upon set", function () {
        var val = "/test/foo/../test.coffee";
        var expected = path.normalize(val);
        var file = new File();

        file.path = val;

        assert.strictEqual(file.path, expected);
        assert.deepStrictEqual(file.history, [expected]);
      });

      it("removes the trailing separator upon set", function () {
        var file = new File();
        file.path = "/test/";

        assert.strictEqual(file.path, path.normalize("/test"));
        assert.deepStrictEqual(file.history, [path.normalize("/test")]);
      });

      it("removes the trailing separator upon set when directory", function () {
        var file = new File({
          stat: {
            isDirectory: function () {
              return true;
            },
          },
        });
        file.path = "/test/";

        assert.strictEqual(file.path, path.normalize("/test"));
        assert.deepStrictEqual(file.history, [path.normalize("/test")]);
      });

      it("removes the trailing separator upon set when symlink", function () {
        var file = new File({
          stat: {
            isSymbolicLink: function () {
              return true;
            },
          },
        });
        file.path = "/test/";

        assert.strictEqual(file.path, path.normalize("/test"));
        assert.deepStrictEqual(file.history, [path.normalize("/test")]);
      });

      it("removes the trailing separator upon set when directory & symlink", function () {
        var file = new File({
          stat: {
            isDirectory: function () {
              return true;
            },
            isSymbolicLink: function () {
              return true;
            },
          },
        });
        file.path = "/test/";

        assert.strictEqual(file.path, path.normalize("/test"));
        assert.deepStrictEqual(file.history, [path.normalize("/test")]);
      });
    });

    describe("symlink get/set", function () {
      it("return null on get with no symlink", function () {
        var file = new File();

        assert.strictEqual(file.symlink, null);
      });

      it("returns _symlink", function () {
        var val = "/test/test.coffee";
        var file = new File();
        file._symlink = val;

        assert.strictEqual(file.symlink, val);
      });

      it("throws on set with non-string", function () {
        var file = new File();

        function invalid() {
          file.symlink = null;
        }
        assert.throws(invalid, { message: "symlink should be a string" });
      });

      it("sets _symlink", function () {
        var val = "/test/test.coffee";
        var expected = path.normalize(val);
        var file = new File();
        file.symlink = val;

        assert.strictEqual(file._symlink, expected);
      });

      it("allows relative symlink", function () {
        var val = "test.coffee";
        var file = new File();
        file.symlink = val;

        assert.strictEqual(file.symlink, val);
      });

      it("normalizes and removes trailing separator upon set", function () {
        var val = "/test/foo/../bar/";
        var expected = path.normalize(val.slice(0, -1));
        var file = new File();
        file.symlink = val;

        assert.strictEqual(file.symlink, expected);
      });
    });
  });
}

suite("stream");
suite("streamx");
suite("readable-stream");
