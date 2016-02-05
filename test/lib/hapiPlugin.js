var hapiPlugin = require('../../lib/hapiPlugin')
var assert = require('assert')

describe('The hapi plugin', function () {
  var server
  var secret = 'fancypants'
  before(function (done) {
    var hapi = require('hapi')
    server = new hapi.Server()
    server.connection({port: 32151})
    server.register({
      register: hapiPlugin,
      options: {
        githubApiToken: 'abcd',
        webhookSecret: secret
      }
    }, function (err) {
      assert.equal(err, null)
      server.initialize(done)
    })
  })
  it('should be named after the package.json', function () {
    assert.deepEqual(hapiPlugin.register.attributes.pkg, require('../../package.json'))
  })
  it('should deliver static files', function () {
    return server.inject({
      url: '/static/style.css'
    })
    .then(function (result) {
      assert.equal(result.statusCode, 200)
    })
  })
  it('should allow webhooks with the correct secret', function () {
    var payload = 'abracarabra' + Math.random()
    var crypto = require('crypto')
    var hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    return server.inject({
      method: 'POST',
      headers: {
        'X-Hub-Signature': hmac.digest('hex')
      },
      payload: payload,
      url: '/webhook'
    }).then(function (data) {
      assert.equal(data.result.error, undefined)
      assert.equal(data.result.success, true)
    })
  })
  it('should block webhooks with the wrong secret', function () {
    var payload = 'abracarabra' + Math.random()
    var crypto = require('crypto')
    var hmac = crypto.createHmac('sha256', secret + 'something')
    hmac.update(payload)
    return server.inject({
      method: 'POST',
      headers: {
        'X-Hub-Signature': hmac.digest('hex')
      },
      payload: payload,
      url: '/webhook'
    }).then(function (data) {
      assert.equal(data.result.error, 'wrong-signature')
      assert.equal(data.result.success, undefined)
    })
  })
})
