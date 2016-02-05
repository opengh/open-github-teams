'use strict'

var async = require('async')

function parseLinks (link) {
  var links = {}
  var reg = /\<([^\>]*)\>\; rel=\"([^\"]*)\"/ig
  var part
  while ((part = reg.exec(link))) {
    links[part[2]] = part[1]
  }
  return links
}

function getGithubList (method, options, pageNr, callback) {
  options.page = pageNr
  options.per_page = 100
  method(options, function (err, list) {
    if (err) return callback(err)
    var links = parseLinks(list.meta.link)
    delete list.meta
    if (links.next) {
      return getGithubList(method, options, pageNr + 1, function (err, rest) {
        err ? callback(err) : callback(null, list.concat(rest))
      })
    }
    callback(null, list)
  })
}

function getTeams (github, org, callback) {
  getGithubList(github.orgs.getTeams, {
    org: org
  }, 1, callback)
}

function getTeamMembers (github, teamId, callback) {
  getGithubList(github.orgs.getTeamMembers, {
    id: teamId
  }, 1, callback)
}

function getTeamRepos (github, teamId, callback) {
  getGithubList(github.orgs.getTeamRepos, {
    id: teamId
  }, 1, callback)
}

function getFullTeams (github, org, callback) {
  getTeams(github, org, function (err, teams) {
    if (err) return callback(err)
    var allMembers = {}
    async.each(teams, function (team, callback) {
      async.parallel({
        members: getTeamMembers.bind(null, github, team.id),
        repos: getTeamRepos.bind(null, github, team.id)
      }, function (err, data) {
        if (err) return callback(err)
        team.members = data.members.map(function (member) {
          if (allMembers[member.login]) {
            return allMembers[member.login]
          }
          allMembers[member.login] = member
          return member
        })
        team.repos = data.repos
        callback(null, team)
      })
    }, function (err) {
      if (err) return callback(err)
      async.each(Object.keys(allMembers), function (login, callback) {
        var member = allMembers[login]
        github.user.getFrom({
          user: login
        }, function (err, data) {
          if (err) return callback()
          member.name = data.name
          callback()
        })
      }, function () {
        callback(null, teams)
      })
    })
  })
}

module.exports = {
  getTeamRepos: getTeamRepos,
  getTeamMembers: getTeamMembers,
  getTeams: getTeams,
  getFullTeams: getFullTeams
}
