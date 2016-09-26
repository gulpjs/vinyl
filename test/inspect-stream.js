'use strict';

var Stream = require('stream');
var expect = require('expect');
var Cloneable = require('cloneable-readable');

var inspectStream = require('../lib/inspect-stream');

describe('inspectStream()', function() {

  it('works on a Stream', function(done) {
    var testStream = new Stream();
    var result = inspectStream(testStream);
    expect(result).toEqual('<Stream>');
    done();
  });

  it('works on a Readable Stream', function(done) {
    var testStream = new Stream.Readable();
    var result = inspectStream(testStream);
    expect(result).toEqual('<ReadableStream>');
    done();
  });

  it('works on a Writable Stream', function(done) {
    var testStream = new Stream.Writable();
    var result = inspectStream(testStream);
    expect(result).toEqual('<WritableStream>');
    done();
  });

  it('works on a Duplex Stream', function(done) {
    var testStream = new Stream.Duplex();
    var result = inspectStream(testStream);
    expect(result).toEqual('<DuplexStream>');
    done();
  });

  it('works on a Transform Stream', function(done) {
    var testStream = new Stream.Transform();
    var result = inspectStream(testStream);
    expect(result).toEqual('<TransformStream>');
    done();
  });

  it('works on a PassThrough Stream', function(done) {
    var testStream = new Stream.PassThrough();
    var result = inspectStream(testStream);
    expect(result).toEqual('<PassThroughStream>');
    done();
  });

  it('works on a custom Stream', function(done) {
    var testStream = new Cloneable(new Stream.Readable());
    var result = inspectStream(testStream);
    expect(result).toEqual('<CloneableStream>');
    done();
  });

  it('returns nothing for a Buffer', function(done) {
    var testBuffer = new Buffer('test');
    var result = inspectStream(testBuffer);
    expect(result).toNotExist();
    done();
  });

  it('returns nothing for null', function(done) {
    var result = inspectStream(null);
    expect(result).toNotExist();
    done();
  });

  it('returns nothing for a String', function(done) {
    var result = inspectStream('foobar');
    expect(result).toNotExist();
    done();
  });
});
