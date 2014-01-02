var File = require('../');
var Stream = require('stream');
var isBuffer = require('../lib/isBuffer');
var isStream = require('../lib/isStream');
var es = require('event-stream');

var should = require('should');
require('mocha');

describe('Using', function() {

  // Helpers
  function streamPrefixer(headerText) {
    var stream = new Stream.PassThrough();
    stream.push(headerText);
    return stream;
  }
  function syncBufferPrefixer(headerText) {
    return function(err, buf) {
      should.not.exist(err);
      if(null === buf) {
        return Buffer(headerText);
      }
      return Buffer.concat([Buffer(headerText), buf]);
    }
  }
  function asyncBufferPrefixer(headerText) {
    return function(err, buf, cb) {
      should.not.exist(err);
      if(null === buf) {
        setTimeout(function() {
          cb(null, Buffer(headerText));
        }, 0);
      } else {
        setTimeout(function() {
          cb(null, Buffer.concat([Buffer(headerText), buf]));
        }, 0);
      }
    }
  }
  function streamMaker(end) {
      var val = new Stream.PassThrough();
      val.on('pipe', (function(chunks) {
        chunks.forEach(val.write);
        if (end) val.end();
      })([].slice.call(arguments, 1)));
  }

  describe('streams', function() {

    it('should work with the pipe method', function(done) {
      var file = new File({
        contents: es.readArray([Buffer('te'), Buffer('st')])
      });
      file.contents = file.pipe(streamPrefixer('plop'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('ploptest');
        done();
      }));
    });

    it('should work with the pipe method and contents are null', function(done) {
      var file = new File();
      file.contents = file.pipe(streamPrefixer('plop'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plop');
        done();
      }));
    });

    it('should work with multiple pipe calls', function(done) {
      var file = new File({
        contents: es.readArray([Buffer('te'), Buffer('st')])
      });
      file.contents = file.pipe(streamPrefixer('plop'));
      file.contents = file.pipe(streamPrefixer('plip'));
      file.contents = file.pipe(streamPrefixer('plap'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plapplipploptest');
        done();
      }));
    });

    it('should work with the transform method', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(function() {
        return streamPrefixer('plop')
      });
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('ploptest');
        done();
      }));
    });

    it('should work with the transform method when contents are null', function(done) {
      var file = new File();
      file.transform(function() {
        return streamPrefixer('plop')
      });
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plop');
        done();
      }));
    });

    it('should work with multiple transform calls', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(function() {
        return streamPrefixer('plop');
      });
      file.transform(function() {
        return streamPrefixer('plip');
      });
      file.transform(function() {
        return streamPrefixer('plap');
      });
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plapplipploptest');
        done();
      }));
    });

  });

  describe('buffers synchonously', function() {

    it('should work with the transform method', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(syncBufferPrefixer('plop'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('ploptest');
        done();
      }));
    });

    it('should work with the transform method when returning null', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(function(err, buf){
        return null;
      });
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('');
        done();
      }));
    });

    it('should work with the transform method when contents are null', function(done) {
      var file = new File();
      file.transform(syncBufferPrefixer('plop'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plop');
        done();
      }));
    });

    it('should work with multiple transform calls', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(syncBufferPrefixer('plop'));
      file.transform(syncBufferPrefixer('plip'));
      file.transform(syncBufferPrefixer('plap'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plapplipploptest');
        done();
      }));
    });

  });

  describe('buffers asynchonously', function() {

    it('should work with the transform method', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(asyncBufferPrefixer('plop'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('ploptest');
        done();
      }));
    });

    it('should work with the transform method when returning null', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(function(err, buf, cb){
        setTimeout(function() {
          cb(null, null);
        }, 0);
      });
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('');
        done();
      }));
    });

    it('should work with the transform method when contents are null', function(done) {
      var file = new File();
      file.transform(asyncBufferPrefixer('plop'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plop');
        done();
      }));
    });

    it('should work with multiple transform calls', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(asyncBufferPrefixer('plop'));
      file.transform(asyncBufferPrefixer('plip'));
      file.transform(asyncBufferPrefixer('plap'));
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plapplipploptest');
        done();
      }));
    });

  });

  describe('nested contents', function() {

    it('should work', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(asyncBufferPrefixer('plop'));
      file.transform(syncBufferPrefixer('plip'));
      file.transform(function() {
          return streamPrefixer('plap');
      });
      file.transform(asyncBufferPrefixer('plop'));
      file.transform(syncBufferPrefixer('plip'));
      file.transform(function() {
          return streamPrefixer('plap');
      });
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plapplipplopplapplipploptest');
        done();
      }));
    });

    it('should be chainable', function(done) {
      var file = new File({
        contents: es.readArray(['te', 'st'])
      });
      file.transform(asyncBufferPrefixer('plop'))
        .transform(syncBufferPrefixer('plip'))
        .transform(function() {
          return streamPrefixer('plap');
        })
        .transform(asyncBufferPrefixer('plop'))
        .transform(syncBufferPrefixer('plip'))
        .transform(function() {
          return streamPrefixer('plap');
        });
      file.contents.pipe(es.wait(function(err, data) {
        should.not.exist(err);
        data.should.equal('plapplipplopplapplipploptest');
        done();
      }));
    });

  });

});
