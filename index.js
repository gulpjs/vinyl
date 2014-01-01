var path = require('path');
var util = require('util');

var clone = require('lodash.clone');

var isBuffer = require('./lib/isBuffer');
var isStream = require('./lib/isStream');
var isNull = require('./lib/isNull');
var inspectStream = require('./lib/inspectStream');
var cloneBuffer = require('./lib/cloneBuffer');
var es = require('event-stream');
var PassThrough = require("stream").PassThrough;

// Inherit of duplex stream
util.inherits(File, PassThrough);

// Constructor
function File(file) {

  // Ensure new were used
  if (!(this instanceof File)) {
    throw Error('Please use the "new" operator to instanciate a File.');
  }

  // Parent constructor
  PassThrough.call(this);

  // Setting defaults
  if (!file) file = {};

  // TODO: should this be moved to vinyl-fs?
  this.cwd = file.cwd || process.cwd();
  this.base = file.base || this.cwd;
  this.path = file.path || null;
  this.buffer = 'boolean' === typeof file.buffer ? file.buffer : true;

  // stat = fs stats object
  // TODO: should this be moved to vinyl-fs?
  this.stat = file.stat || null;

  // contents = stream, buffer, or null if not read
  this.contents = file.contents || null;
  
  // streams awaiting buffers
  this._awaitStreams = [];
}

File.prototype.isNull = function() {
  return isNull(this.contents);
};

File.prototype.setBuffer = function(buf, cb) {
  if (isNull(buf)) {
    this.contents = null;
    if (!this.buffer) {
      this._awaitStreams.shift();
    }
    cb(null);
    return;
  }
  if (!isBuffer(buf)) {
    cb(new Error('The setBuffer method accept only buffers or null.'));
    return;
  }
  if (this.buffer) {
    this.contents = buf;
    cb(null);
  } else {
    if (!this._awaitStreams.length) {
      cb(new Error('The setBuffer must be called once after a getBuffer method.'));
      return;
    }
    // Pick the awaiting stream and write the buffer to it
    es.readable(function(count, cb2) {
      this.emit('data', buf);
      this.emit('end');
      cb2();
      cb(null);
    }).pipe(this._awaitStreams.shift());
  }
};

File.prototype.getBuffer = function(cb) {
  var content = this.contents;
  if (this.isNull()) {
    cb(null, null);
    return;
  }
  if (this.buffer) {
    cb(null, content);
  } else {
    // Creating a new PassThrough stream to substituate the old stream
    this.contents = new PassThrough();
    this._awaitStreams.push(this.contents);
    // Convert the previous streams contents to a buffer
    content.pipe(es.wait(function(err, data) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, Buffer(data));
    }));
  }
};

// TODO: should this be moved to vinyl-fs?
File.prototype.isDirectory = function() {
  return this.isNull() && this.stat && this.stat.isDirectory();
};

File.prototype.clone = function() {
  var clonedStat = clone(this.stat);
  var clonedContents = this.buffer && !this.isNull() ?
    cloneBuffer(this.contents) :
    this.contents;

  return new File({
    cwd: this.cwd,
    base: this.base,
    path: this.path,
    stat: clonedStat,
    contents: clonedContents
  });
};

File.prototype.pipe = function(stream, options) {
  options = options || {};
  options.end = ('boolean'===typeof options.end ? options.end : true);

  if (this.isNull()) {
    if (options.end) {
      stream.end();
    }
    return;
  }
  if (this.buffer) {
    return es.readable(function(count, cb) {
      this.emit('data', buf);
      if (options.end) {
        this.emit('end');
      }
      cb();
    });
  } else {
    return this.contents.pipe(stream, options);
  }

  return stream;
};

File.prototype.inspect = function() {
  var inspect = [];

  // use relative path if possible
  var filePath = (this.base && this.path) ? this.relative : this.path;

  if (filePath) {
    inspect.push('"'+filePath+'"');
  }

  if (this.isBuffer()) {
    inspect.push(this.contents.inspect());
  }

  if (this.isStream()) {
    inspect.push(inspectStream(this.contents));
  }

  return '<File '+inspect.join(' ')+'>';
};

// virtual attributes
// or stuff with extra logic
Object.defineProperty(File.prototype, 'contents', {
  get: function() {
    return this._contents;
  },
  set: function(val) {
    if (!isBuffer(val) && !isStream(val) && !isNull(val)) {
      throw new Error("File.contents can only be a Buffer, a Stream, or null.");
    }
    this._contents = val;
  }
});

// TODO: should this be moved to vinyl-fs?
Object.defineProperty(File.prototype, 'relative', {
  get: function() {
    if (!this.base) throw new Error('No base specified! Can not get relative.');
    if (!this.path) throw new Error('No path specified! Can not get relative.');
    return path.relative(this.base, this.path);
  },
  set: function() {
    throw new Error('File.relative is generated from the base and path attributes. Do not modify it.');
  }
});

module.exports = File;
