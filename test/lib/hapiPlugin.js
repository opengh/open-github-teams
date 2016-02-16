var hapiPlugin = require('../../lib/hapiPlugin')
var assert = require('assert')

describe('A hapi plugin with missing organization', function () {
  var server
  before(function (done) {
    var hapi = require('hapi')
    server = new hapi.Server()
    server.connection({port: 32151})
    server.register(hapiPlugin, function (err) {
      assert.equal(err, null)
      server.initialize(done)
    })
  })
  after(function (done) {
    server.stop(done)
  })
  it('should deliver an empty /', function () {
    return server.inject({
      url: '/'
    })
    .then(function (result) {
      assert.equal(result.statusCode, 200)
    })
  })
  it('should not deliver a teams.json', function () {
    return server.inject({
      url: '/teams.json'
    })
    .then(function (result) {
      assert.equal(result.statusCode, 404)
    })
  })
})

describe('A hapi plugin with missing github token', function () {
  var server
  before(function (done) {
    var hapi = require('hapi')
    server = new hapi.Server()
    server.connection({port: 32151})
    server.register({
      register: hapiPlugin,
      options: {
        githubOrganization: 'mona'
      }
    }, function (err) {
      assert.equal(err, null)
      server.initialize(done)
    })
  })
  after(function (done) {
    server.stop(done)
  })
  it('should deliver an empty /', function () {
    return server.inject({
      url: '/'
    })
    .then(function (result) {
      assert.equal(result.statusCode, 200)
    })
  })
  it('should not deliver a teams.json', function () {
    return server.inject({
      url: '/teams.json'
    })
    .then(function (result) {
      assert.equal(result.statusCode, 404)
    })
  })
})

describe('A well configured HAPI plugin', function () {
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
        githubOrganization: 'mona',
        webhookSecret: secret
      }
    }, function (err) {
      assert.equal(err, null)
      server.initialize(done)
    })
  })
  after(function (done) {
    server.stop(done)
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
  it('should allow webhooks with the correct sha256 secret', function () {
    var payload = 'abracarabra' + Math.random()
    var crypto = require('crypto')
    var hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    return server.inject({
      method: 'POST',
      headers: {
        'X-Hub-Signature': 'sha256=' + hmac.digest('hex')
      },
      payload: payload,
      url: '/webhook'
    }).then(function (data) {
      assert.equal(data.result.error, undefined)
      assert.equal(data.result.success, true)
    })
  })
  it('should allow webhooks with the correct sha1 secret', function () {
    var payload = 'abracarabra' + Math.random()
    var crypto = require('crypto')
    var hmac = crypto.createHmac('sha1', secret)
    hmac.update(payload)
    return server.inject({
      method: 'POST',
      headers: {
        'X-Hub-Signature': 'sha1=' + hmac.digest('hex')
      },
      payload: payload,
      url: '/webhook'
    }).then(function (data) {
      assert.equal(data.result.error, undefined)
      assert.equal(data.result.success, true)
    })
  })
  it('should notify about a missing signature', function () {
    var payload = 'abracarabra' + Math.random()
    var crypto = require('crypto')
    return server.inject({
      method: 'POST',
      headers: {
      },
      payload: payload,
      url: '/webhook'
    }).then(function (data) {
      assert.equal(data.result.error, 'missing-signature')
      assert.equal(data.result.success, undefined)
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
        'X-Hub-Signature': 'sha256=' + hmac.digest('hex')
      },
      payload: payload,
      url: '/webhook'
    }).then(function (data) {
      assert.equal(data.result.error, 'wrong-signature')
      assert.equal(data.result.success, undefined)
    })
  })
})
