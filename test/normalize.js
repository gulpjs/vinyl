"use strict";

var path = require("node:path");
var assert = require("node:assert");
var { describe, it } = require("node:test");

var normalize = require("../lib/normalize");

describe("normalize()", function () {
  it("leaves empty strings unmodified", function () {
    var result = normalize("");
    assert.strictEqual(result, "");
  });

  it("applies path.normalize for everything else", function () {
    var str = "/foo//../bar/baz";
    var result = normalize(str);
    assert.strictEqual(result, path.normalize(str));
  });
});
