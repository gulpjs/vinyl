var File = require('../');
var Stream = require('stream');
var isBuffer = require('../lib/isBuffer');
var isStream = require('../lib/isStream');

var should = require('should');
require('mocha');

describe.only('Absctract', function() {

  // Helpers
  function streamPrefixer(headerText) {
    var stream = new Stream.PassThrough();
    stream.push(headerText);
    return stream;
  }
  function bufferPrefixer(headerText) {
    return function(err, buf) {
      should.not.exist(err);
      if(null === buf) {
        return Buffer(headerText);
      }
      return Buffer.concat(Buffer(headerText), buf);
    }
  }

  describe('using streams', function() {

    it('should work with buffer set to false and buffer in', function(done) {
      var file = new File({contents: Buffer('test'), buffer: false});
      file.contents = file.pipe(streamPrefixer('plop'));
      file.getBuffer(function(err, buf) {
        should.not.exist(err);
        isBuffer(buf).should.equal(true);
        buf.toString('utf8').should.equal('ploptest');
        done();
      });
    });

    it('should work with buffer set to true and buffer in', function(done) {
      var file = new File({contents: Buffer('test'), buffer: true});
      file.contents = file.pipe(streamPrefixer('plop'));
      file.getBuffer(function(err, buf) {
        should.not.exist(err);
        isBuffer(buf).should.equal(true);
        buf.toString('utf8').should.equal('ploptest');
        done();
      });
    });

    it('should work with buffer set to false and stream in', function(done) {
      var val = new Stream.Transform();
      var file = new File({contents: val, buffer: false});
      val.push(Buffer('te'));
      val.push(Buffer('st'));
      val.end();
      file.contents = file.pipe(streamPrefixer('plop'));
      file.getBuffer(function(err, buf) {
        should.not.exist(err);
        isBuffer(buf).should.equal(true);
        buf.toString('utf8').should.equal('ploptest');
        done();
      });
    });

    it('should work with buffer set to true and stream in', function(done) {
      var val = new Stream.PassThrough();
      var file = new File({contents: val, buffer: true});
      val.write(Buffer('te'));
      val.write(Buffer('st'));
      val.end();
      setTimeout(function() {
        file.contents = file.pipe(streamPrefixer('plop'));
        file.getBuffer(function(err, buf) {
          should.not.exist(err);
          isBuffer(buf).should.equal(true);
          buf.toString('utf8').should.equal('ploptest');
          done();
        });
      },0);
    });

  });

});
