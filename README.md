[![Build Status](https://travis-ci.org/wearefractal/vinyl.png?branch=master)](https://travis-ci.org/wearefractal/vinyl)

[![NPM version](https://badge.fury.io/js/vinyl.png)](http://badge.fury.io/js/vinyl)

## Information

<table>
<tr> 
<td>Package</td><td>vinyl</td>
</tr>
<tr>
<td>Description</td>
<td>A virtual file format</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.9</td>
</tr>
</table>

## File

```javascript
var File = require('vinyl');

var coffeeFile = new File({
  cwd: "/",
  base: "/test/",
  path: "/test/file.coffee"
  contents: fs.createReadStream("/test/file.coffee")
});
```

### constructor(options)

#### options.cwd

Type: `String`  
Default: `process.cwd()`

#### options.base

Used for relative pathing. Typically where a glob starts.

Type: `String`  
Default: `options.cwd`

#### options.path

Full path to the file.

Type: `String`  
Default: `null`

#### options.stat

The result of an `fs.stat` call. See
 [fs.Stats](http://nodejs.org/api/fs.html#fs_class_fs_stats) for more
 information.

Type: `fs.Stats`  
Default: `null`

#### options.contents

File contents as a stream.

Type: `Stream, or null`  
Default: `null`

### isBuffer()

(Deprecated) Always returns `false`. Use the `File.transform` method to deal
 with buffers.

### isStream()

(Deprecated) Returns `true` when `file.contents` is not `null`.

### isNull()

Returns `true` if `file.contents` is `null`.

### clone()

Returns a new `File` object with all attributes cloned.

### pipe(stream, options)

If `file.contents` is a `Stream`, it will pipe it to the given stream and emit
 the `'end'` event to it except if `options.end` is set to `false`.

If `file.contents` is `null`, it will end the stream except if `options.end` is
 set to `false`.

Returns the stream.

#### options.end

Emit the `end` event to the piped in stream

Type: `Boolean`  
Default: `true`

### transform(val, options)

If val is a Stream, it will pipe the internal stream to it and set it as the
 new internal stream.

If val is a Function, it will buffer the internal stream contents and call the
 given function with 3 parameters:
* an optionnal `Error` object, will be `null` if none
* the collected `Buffer`
* the callback `Function` wich accept an `Error` object or null if none and the
   transformed `Buffer`.

Returns the File instance in order to be chained.

#### Sample

Using streams:

```js
  coffeeFile.transform(myTransformStream)
    .transform(myTransformStream2)
    .transform(myTransformStream3);
```

Using buffers:

```js
  coffeeFile.transform(function(err, buf, callback) {
    // Dealing with errors
    if(err) {
      throw err;
    }
    if(!buf.length) {
      callback(new Error('Cannot append text to an empty file.'));
      return;
    }
    // Append a text to the Buffer
    buf = Buffer.concat([
      Buffer('// Generated at ' + new Date()),
      buf
    ]);
    // Pipe the result back into the stream (can be called asynchronously)
    callback(null, buf);
  });
```

#### options.end

Emit the `end` event to the piped in stream

Type: `Boolean`  
Default: `true`

### inspect()

Returns a pretty `String` interpretation of the `File`. Useful for `console.log`.

### relative

Returns `path.relative` for the file base and file path.

Example:

```javascript
var file = new File({
  cwd: "/",
  base: "/test/",
  path: "/test/file.coffee"
});

console.log(file.relative); // file.coffee
```


## LICENSE

(MIT License)

Copyright (c) 2013 Fractal <contact@wearefractal.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
