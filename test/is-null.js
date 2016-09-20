'use strict';

var expect = require('expect');

var isNull = require('../lib/isNull');

describe('isNull()', function() {

  it('returns true for null', function(done) {
    expect(isNull(null)).toEqual(true);
    done();
  });

  it('returns false for undefined', function(done) {
    expect(isNull()).toEqual(false);
    expect(isNull(undefined)).toEqual(false);
    done();
  });

  it('returns false for defined values', function(done) {
    expect(isNull(1)).toEqual(false);
    expect(isNull('test')).toEqual(false);
    done();
  });
});
