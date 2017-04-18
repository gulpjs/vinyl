'use strict';

var path = require('path');
var removeTrailingSep = require('remove-trailing-separator');

function normalize(str) {
  return str === '' ? str : removeTrailingSep(path.normalize(str));
}

module.exports = normalize;
