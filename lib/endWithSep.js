var path = require('path');

module.exports = function(str) {
  return str.substr(-1) === path.sep ? str : str + path.sep;
};
