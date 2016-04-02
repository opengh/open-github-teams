'use strict'

var async = require('async')
var getGithubList = require('./getGithubList')

function getTeams (github, org, callback) {
  getGithubList(github.orgs.getTeams, {
    org: org
  }, callback)
}

function getTeamMembers (github, teamId, callback) {
  getGithubList(github.orgs.getTeamMembers, {
    id: teamId
  }, callback)
}

function getTeamRepos (github, teamId, callback) {
  getGithubList(github.orgs.getTeamRepos, {
    id: teamId
  }, callback)
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
