'use strict';

var expect = require('expect');

var inspectStream = require('../lib/inspect-stream');

function suite(moduleName) {
  var stream = require(moduleName);

  describe('inspectStream (' + moduleName + ')', function () {
    it('works on a Stream', function (done) {
      var testStream = new stream.Stream();
      var result = inspectStream(testStream);
      expect(result).toEqual('<Stream>');
      done();
    });

    it('works on a Readable Stream', function (done) {
      var testStream = new stream.Readable();
      var result = inspectStream(testStream);
      expect(result).toEqual('<ReadableStream>');
      done();
    });

    it('works on a Writable Stream', function (done) {
      var testStream = new stream.Writable();
      var result = inspectStream(testStream);
      expect(result).toEqual('<WritableStream>');
      done();
    });

    it('works on a Duplex Stream', function (done) {
      var testStream = new stream.Duplex();
      var result = inspectStream(testStream);
      expect(result).toEqual('<DuplexStream>');
      done();
    });

    it('works on a Transform Stream', function (done) {
      var testStream = new stream.Transform();
      var result = inspectStream(testStream);
      expect(result).toEqual('<TransformStream>');
      done();
    });

    it('works on a PassThrough Stream', function (done) {
      var testStream = new stream.PassThrough();
      var result = inspectStream(testStream);
      expect(result).toEqual('<PassThroughStream>');
      done();
    });

    it('works on a custom Stream', function (done) {
      class Custom extends stream.Readable {}
      var testStream = new Custom();
      var result = inspectStream(testStream);
      expect(result).toEqual('<CustomStream>');
      done();
    });
  });
}

suite('stream');
suite('streamx');
suite('readable-stream');
