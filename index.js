var path = require('path');

var clone = require('lodash.clone');

var isBuffer = require('./lib/isBuffer');
var isStream = require('./lib/isStream');
var isNull = require('./lib/isNull');
var inspectStream = require('./lib/inspectStream');
var cloneBuffer = require('./lib/cloneBuffer');

function File(file) {
  if (!file) file = {};

  this.cwd = file.cwd || process.cwd();
  this.base = file.base || this.cwd;
  this.path = file.path || null;

  // stat = fs stats object
  this.stat = file.stat || null;

  // contents = stream, buffer, or null if not read
  this.contents = file.contents || null;
}

File.prototype.isBuffer = function() {
  return isBuffer(this.contents);
};

File.prototype.isStream = function() {
  return isStream(this.contents);
};

File.prototype.isNull = function() {
  return isNull(this.contents);
};

File.prototype.isDirectory = function() {
  return this.isNull() && this.stat && this.stat.isDirectory();
};

File.prototype.clone = function() {
  var clonedStat = clone(this.stat);
  var clonedContents = this.isBuffer() ? cloneBuffer(this.contents) : this.contents;

  return new File({
    cwd: this.cwd,
    base: this.base,
    path: this.path,
    stat: clonedStat,
    contents: clonedContents
  });
};

File.prototype.pipe = function(stream) {
  if (this.isStream()) {
    return this.contents.pipe(stream);
  }
  if (this.isBuffer()) {
    stream.write(this.contents);
    return stream;
  }

  // must be null, dont do anything
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