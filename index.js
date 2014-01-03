var path = require('path');
var util = require('util');

var clone = require('lodash.clone');

var isBuffer = require('./lib/isBuffer');
var isStream = require('./lib/isStream');
var isNull = require('./lib/isNull');
var BufferStream = require('./lib/bufferStream');
var inspectStream = require('./lib/inspectStream');

// Constructor
function File(file) {

  // Ensure new were used
  if (!(this instanceof File)) {
    throw Error('Please use the "new" operator to instanciate a File.');
  }

  // Setting defaults
  if (!file) file = {};

  // TODO: should this be moved to vinyl-fs?
  this.cwd = file.cwd || process.cwd();
  this.base = file.base || this.cwd;
  this.path = file.path || null;

  // stat = fs stats object
  // TODO: should this be moved to vinyl-fs?
  this.stat = file.stat || null;

  // contents = stream or null if not read
  this.contents = file.contents || null;
}

File.prototype.isNull = function() {
  return isNull(this._contents);
};

// Old API
File.prototype.isBuffer = function() {
  return false;
};

File.prototype.isStream = function() {
  return !isNull(this._contents);
};

// TODO: should this be moved to vinyl-fs?
File.prototype.isDirectory = function() {
  return this.isNull() && this.stat && this.stat.isDirectory();
};

File.prototype.clone = function() {
  var clonedStat = clone(this.stat);

  return new File({
    cwd: this.cwd,
    base: this.base,
    path: this.path,
    stat: clonedStat,
    contents: this._contents
  });
};

File.prototype.transform = function(val, options) {
  var streamCb, buf;

  // Dealing with streams
  if (isStream(val)) {
    this._contents = this.pipe(val, options);
  // Dealing with buffers
  } else if ('function' === typeof val) {
    this._contents = this.pipe(new BufferStream(val), options);
  } else {
    throw new Error('The File.transform method must be called with a callback'
      +' function for buffers or with a stream.');
  }

  return this;
  
};

File.prototype.pipe = function(stream, options) {
  
  options = options || {};
  options.end = ('boolean'===typeof options.end ? options.end : true);

  if (this.isNull()) {
    if (options.end) {
      stream.end();
    }
  } else {
    stream = this._contents.pipe(stream, options);
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

  if (! this.isNull()) {
    inspect.push(inspectStream(this._contents));
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
    if(isBuffer(val)) {
      throw new Error("File.contents cannot contain a Buffer, use File.transform.");
    }
    if (!isStream(val) && !isNull(val)) {
      throw new Error("File.contents can only be a Stream or null.");
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
