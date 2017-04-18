'use strict';

var path = require('path');
var urlRegex = require('url-regex');
var normalizeUrl = require('normalize-url');
var removeTrailingSep = require('remove-trailing-separator');

function normalize(str) {
  if (str === '') {
    return str;
  }

  if (urlRegex().test(str) && !/^www\./.test(str)) {
    return normalizeUrl(str, {
      normalizeProtocol: false,
      stripFragment: false,
      stripWWW: false,
      removeTrailingSlash: false,
    });
  }

  return removeTrailingSep(path.normalize(str));
}

module.exports = normalize;
