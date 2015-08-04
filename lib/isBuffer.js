var buf = require('buffer');
var Buffer = buf.Buffer;

// could use Buffer.isBuffer but this is the same exact thing...
module.exports = Buffer.isBuffer;
