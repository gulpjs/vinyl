var normalize = require('path').normalize;

module.exports = function(str) {
  return str === '' ? str : normalize(str);
};
