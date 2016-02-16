var count = require('../../../../web/views/helpers/count')
var assert = require('assert')

describe('counting of items in hbs arrays', function () {
  it('should support counting of arrays', function () {
    assert.equal(count(['a']), 1)
  })
  it('should support counting other things', function () {
    assert.equal(count(null), '?')
  })
  it('should support counting other things', function () {
    assert.equal(count(''), '?')
  })
})
