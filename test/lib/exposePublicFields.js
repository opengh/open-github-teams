var exposePublicFields = require('../../lib/exposePublicFields')
var assert = require('assert')

describe('Exposing teams', function () {
  it('should include the team name', function () {
    assert.equal(exposePublicFields({
      name: 'luna', repos: [], members: []
    }).name, 'luna')
  })
  it('should not include the team id', function () {
    assert.equal(exposePublicFields({
      repos: [], members: []
    }).id, undefined)
  })
  it('should include the slug', function () {
    assert.equal(exposePublicFields({
      repos: [], members: [], slug: 'ho'
    }).slug, 'ho')
  })
  it('should include the description', function () {
    assert.equal(exposePublicFields({
      repos: [], members: [], description: 'umpa'
    }).description, 'umpa')
  })
})
describe('Exposing members', function () {
  it('should have a login', function () {
    assert.equal(exposePublicFields({
      repos: [], members: [{login: 'humpdy'}]
    }).members[0].login, 'humpdy')
  })
  it('should have an avatar', function () {
    assert.equal(exposePublicFields({
      repos: [], members: [{avatar_url: 'dumpdy'}]
    }).members[0].avatar_url, 'dumpdy')
  })
})
describe('Exposing repositories', function () {
  it('should have name', function () {
    assert.equal(exposePublicFields({
      members: [], repos: [{name: 'humpdy'}]
    }).repos[0].name, 'humpdy')
  })
  it('should have fork', function () {
    assert.equal(exposePublicFields({
      members: [], repos: [{fork: 'spoon'}]
    }).repos[0].fork, 'spoon')
  })
  it('should have default_branch', function () {
    assert.equal(exposePublicFields({
      members: [], repos: [{default_branch: 'master'}]
    }).repos[0].default_branch, 'master')
  })
  it('should have created_at', function () {
    assert.equal(exposePublicFields({
      members: [], repos: [{created_at: 'time'}]
    }).repos[0].created_at, 'time')
  })
  it('should have description', function () {
    assert.equal(exposePublicFields({
      members: [], repos: [{description: 'or something else'}]
    }).repos[0].description, 'or something else')
  })
})
