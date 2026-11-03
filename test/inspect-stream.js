"use strict";

var assert = require("node:assert");
var { describe, it } = require("node:test");

var inspectStream = require("../lib/inspect-stream");

function suite(moduleName) {
  var stream = require(moduleName);

  describe("inspectStream (" + moduleName + ")", function () {
    it("works on a Stream", function () {
      var testStream = new stream.Stream();
      var result = inspectStream(testStream);
      assert.strictEqual(result, "<Stream>");
    });

    it("works on a Readable Stream", function () {
      var testStream = new stream.Readable();
      var result = inspectStream(testStream);
      assert.strictEqual(result, "<ReadableStream>");
    });

    it("works on a Writable Stream", function () {
      var testStream = new stream.Writable();
      var result = inspectStream(testStream);
      assert.strictEqual(result, "<WritableStream>");
    });

    it("works on a Duplex Stream", function () {
      var testStream = new stream.Duplex();
      var result = inspectStream(testStream);
      assert.strictEqual(result, "<DuplexStream>");
    });

    it("works on a Transform Stream", function () {
      var testStream = new stream.Transform();
      var result = inspectStream(testStream);
      assert.strictEqual(result, "<TransformStream>");
    });

    it("works on a PassThrough Stream", function () {
      var testStream = new stream.PassThrough();
      var result = inspectStream(testStream);
      assert.strictEqual(result, "<PassThroughStream>");
    });

    it("works on a custom Stream", function () {
      class Custom extends stream.Readable {}
      var testStream = new Custom();
      var result = inspectStream(testStream);
      assert.strictEqual(result, "<CustomStream>");
    });
  });
}

suite("stream");
suite("streamx");
suite("readable-stream");
