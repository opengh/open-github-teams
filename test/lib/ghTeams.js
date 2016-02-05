var ghTeams = require('../../lib/ghTeams')
var assert = require('assert')

function meta (obj, meta) {
  obj = obj || []
  obj.meta = meta || {}
  return obj
}

function emptyGhList (opts, callback) {
  setImmediate(function () {
    callback(null, meta())
  })
}

function staticResponse (testOpts, result) {
  return function (opts, callback) {
    Object.keys(testOpts).forEach(function (key) {
      assert.equal(opts[key], testOpts[key])
    })
    setImmediate(function () {
      callback(null, meta(result))
    })
  }
}

function fail (err) {
  return function (opts, callback) {
    setImmediate(callback.bind(null, err))
  }
}

describe('Loading github teams', function () {
  it('return an empty list of teams if no teams are available', function (done) {
    var org = 'org' + Math.random()
    ghTeams.getFullTeams({
      orgs: {
        getTeams: function (opts, callback) {
          assert.equal(opts.org, org)
          assert.equal(opts.page, 1)
          assert.equal(opts.per_page, 100)
          emptyGhList(null, callback)
        }
      }
    }, org, function (err, list) {
      assert.equal(err, null)
      assert.equal(list.length, 0)
      done()
    })
  })
  it('should bubble errors', function (done) {
    var org = 'org' + Math.random()
    var origErr = new Error('errs')
    ghTeams.getFullTeams({
      orgs: {
        getTeams: fail(origErr)
      }
    }, org, function (err, list) {
      assert.equal(err, origErr)
      done()
    })
  })
  it('should bubble errors from the second page', function (done) {
    var org = 'org' + Math.random()
    var origErr = new Error('errs')
    var first = true
    ghTeams.getFullTeams({
      orgs: {
        getTeams: function (opts, callback) {
          setImmediate(function () {
            if (first) {
              first = false
              assert.equal(opts.page, 1)
              callback(null, meta([{
                name: 'test_name',
                id: 'test_id'
              }], {link: '<url>; rel="next"'}))
            } else {
              callback(origErr)
            }
          })
        }
      }
    }, org, function (err, list) {
      assert.equal(err, origErr)
      done()
    })
  })
  it('return an list of one team if one is available', function (done) {
    var org = 'org' + Math.random()
    ghTeams.getFullTeams({
      orgs: {
        getTeams: staticResponse({org: org}, [{
          name: 'test_name',
          id: 'test_id'
        }]),
        getTeamRepos: emptyGhList,
        getTeamMembers: emptyGhList
      }
    }, org, function (err, list) {
      assert.equal(err, null)
      assert.deepEqual(list, [{
        name: 'test_name',
        id: 'test_id',
        members: [],
        repos: []
      }])
      done()
    })
  })
  it('return an list of one team if one is available', function (done) {
    var org = 'org' + Math.random()
    var origErr = new Error('errs')
    ghTeams.getFullTeams({
      orgs: {
        getTeams: staticResponse({org: org}, [{
          name: 'test_name',
          id: 'test_id'
        }]),
        getTeamRepos: fail(origErr),
        getTeamMembers: emptyGhList
      }
    }, org, function (err, list) {
      assert.equal(err, origErr)
      done()
    })
  })
  it('return the repos for the teams', function (done) {
    var org = 'org' + Math.random()
    ghTeams.getFullTeams({
      orgs: {
        getTeams: staticResponse({org: org}, [{
          name: 'test_name',
          id: 'test_id'
        }]),
        getTeamMembers: emptyGhList,
        getTeamRepos: staticResponse({id: 'test_id'}, [{
          name: 'y',
          id: 'x'
        }])
      }
    }, org, function (err, list) {
      assert.equal(err, null)
      assert.deepEqual(list, [{
        name: 'test_name',
        id: 'test_id',
        repos: [{
          name: 'y',
          id: 'x'
        }],
        members: []
      }])
      done()
    })
  })
  it('returns multi paged', function (done) {
    var org = 'org' + Math.random()
    var first = true
    ghTeams.getFullTeams({
      orgs: {
        getTeams: function (opts, callback) {
          setImmediate(function () {
            if (first) {
              first = false
              assert.equal(opts.page, 1)
              callback(null, meta([{
                name: 'test_name',
                id: 'test_id'
              }], {link: '<url>; rel="next"'}))
            } else {
              assert.equal(opts.page, 2)
              callback(null, meta([{
                name: 'test_name2',
                id: 'test_id2'
              }]))
            }
          })
        },
        getTeamMembers: emptyGhList,
        getTeamRepos: emptyGhList
      }
    }, org, function (err, list) {
      assert.equal(err, null)
      assert.deepEqual(list, [{
        name: 'test_name',
        id: 'test_id',
        repos: [],
        members: []
      }, {
        name: 'test_name2',
        id: 'test_id2',
        repos: [],
        members: []
      }])
      done()
    })
  })
  it('return the members for the teams', function (done) {
    var org = 'org' + Math.random()
    ghTeams.getFullTeams({
      user: {
        getFrom: staticResponse({}, {})
      },
      orgs: {
        getTeams: staticResponse({org: org}, [{
          name: 'test_name',
          id: 'test_id'
        }]),
        getTeamMembers: staticResponse({id: 'test_id'}, [{
          login: 'y',
          avatar: 'x'
        }]),
        getTeamRepos: emptyGhList
      }
    }, org, function (err, list) {
      assert.equal(err, null)
      assert.deepEqual(list, [{
        name: 'test_name',
        id: 'test_id',
        repos: [],
        members: [{
          login: 'y',
          avatar: 'x',
          name: undefined
        }]
      }])
      done()
    })
  })
  it('use the real name of the user', function (done) {
    var org = 'org' + Math.random()
    ghTeams.getFullTeams({
      user: {
        getFrom: staticResponse({user: 'y'}, {
          name: 'Franzesco'
        })
      },
      orgs: {
        getTeams: staticResponse({org: org}, [{
          name: 'test_name',
          id: 'test_id'
        }]),
        getTeamMembers: staticResponse({id: 'test_id'}, [{
          login: 'y',
          avatar: 'x'
        }]),
        getTeamRepos: emptyGhList
      }
    }, org, function (err, list) {
      assert.equal(err, null)
      assert.deepEqual(list, [{
        name: 'test_name',
        id: 'test_id',
        repos: [],
        members: [{
          login: 'y',
          name: 'Franzesco',
          avatar: 'x'
        }]
      }])
      done()
    })
  })
})
