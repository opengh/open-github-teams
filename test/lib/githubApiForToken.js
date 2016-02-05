var githubApiForToken = require('../../lib/githubApiForToken')
var assert = require('assert')

describe('Getting the github api', function () {
  it('should work with the token', function (done) {
    var api = githubApiForToken('abcd')
    assert.equal(api.auth.type, 'oauth')
    assert.equal(api.auth.token, 'abcd')
    done()
  })
})
