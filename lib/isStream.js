var Stream = require('readable-stream').Stream;

module.exports = function(o) {
  return !!o && o instanceof Stream;
};
