'use strict'

module.exports = function (token) {
  var GitHubApi = require('github')
  var github = new GitHubApi({
    version: '3.0.0',
    headers: {
      'user-agent': 'open-github-teams'
    }
  })
  github.authenticate({
    type: 'oauth',
    token: token
  })
  return github
}
