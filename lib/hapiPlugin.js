'use strict'
var Path = require('path')

function registerHapiPlugin (server, options, next) {
  server.register([require('inert'), require('vision')], function (err) {
    if (err) throw err

    var getFullTeams = require('./ghTeams').getFullTeams
    var exposePublicFields = require('./exposePublicFields')
    var hasWebhook = false
    var nextAutoUpdate = null
    var organization = options.githubOrganization
    var token = options.githubApiToken
    var github
    var lastWebhook = null
    var expiresIn = 1000 * 60 * 60 * 24 * 20 // Cache the data for 20 days (note: hapi max: 2147483647)

    server.method('githubFullTeam', function (organization, next) {
      if (!github) {
        github = require('./githubApiForToken')(token)
      }
      getFullTeams(github, organization, function (err, data) {
        nextAutoUpdate = new Date(Date.now() + expiresIn)
        next(err, data ? data.map(exposePublicFields) : undefined)
      })
    }, {
      cache: {
        generateTimeout: 1000 * 60 * 10, // Wait 10 minutes for github to return all data
        expiresIn: expiresIn
      }
    })

    server.views({
      engines: {
        hbs: require('handlebars')
      },
      isCached: false,
      relativeTo: Path.join(__dirname, '..', 'web', 'views'),
      helpersPath: 'helpers'
    })

    server.route({
      method: 'GET',
      path: '/static/{param*}',
      handler: {
        directory: {
          path: Path.join(__dirname, '..', 'web', 'static'),
          redirectToSlash: true,
          index: true
        }
      }
    })

    if (!organization) {
      server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
          reply.view('index')
        }
      })
      next()
      return
    }

    if (!token) {
      server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
          reply.view('index', {
            org: organization,
            noAuthToken: true,
            totalMembers: '?'
          })
        }
      })
      next()
      return
    }

    if (options.webhookSecret) {
      hasWebhook = true

      var crypto = require('crypto')
      server.route({
        method: 'POST',
        path: '/webhook',
        config: {
          payload: {
            parse: false
          }
        },
        handler: function (request, reply) {
          var signature = request.headers['x-hub-signature']
          if (!signature) {
            return reply({error: 'missing-signature'})
          }
          var hmac = crypto.createHmac('sha256', options.webhookSecret)
          hmac.update(request.payload)
          var check = hmac.digest('hex')
          if (signature !== check) {
            return reply({error: 'wrong-signature'})
          }
          lastWebhook = new Date()
          server.methods.githubFullTeam.cache.drop(organization, function (err) {
            if (err) {
              console.log(err)
              return reply({error: 'internal-error'})
            }
            reply({success: true})
          })
        }
      })
    }

    server.route({
      method: 'GET',
      path: '/teams.json',
      config: {
        cors: {
          origin: ['*']
        }
      },
      handler: function (req, reply) {
        server.methods.githubFullTeam(organization, function (err, data) {
          if (err) {
            return reply({error: 'internal-error'})
          }
          reply(data)
        })
      }
    })

    server.route({
      method: 'GET',
      path: '/',
      handler: function (req, reply) {
        server.methods.githubFullTeam(organization, function (err, teams) {
          var totalMembers = '?'
          if (teams) {
            totalMembers = Object.keys(teams.reduce(function (all, team) {
              if (team.members) {
                team.members.forEach(function (member) {
                  all[member.login] = member
                })
              }
              return all
            }, {})).length
          }
          reply.view('index', {
            org: organization,
            error: err,
            totalMembers: totalMembers,
            teams: teams,
            hasWebhook: hasWebhook,
            nextAutoUpdate: nextAutoUpdate,
            lastWebhook: lastWebhook
          })
        })
      }
    })
    next()
  })
}

registerHapiPlugin.attributes = {
  pkg: require('../package.json')
}

exports.register = registerHapiPlugin
