'use strict'

module.exports = function (team) {
  return {
    name: team.name,
    slug: team.slug,
    description: team.description,
    repos: team.repos.filter(function (repo) {
      return !repo.private
    }).map(function (repo) {
      return {
        name: repo.name,
        full_name: repo.full_name,
        created_at: repo.created_at,
        description: repo.description,
        fork: repo.fork,
        homepage: repo.homepage,
        html_url: repo.html_url,
        default_branch: repo.default_branch
      }
    }),
    members: team.members.map(function (member) {
      return {
        login: member.login,
        name: member.name,
        avatar_url: member.avatar_url
      }
    })
  }
}
