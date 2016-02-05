'use strict'
var Path = require('path')

function registerHapiPlugin (server, options, next) {
  server.register([require('inert'), require('vision')], function (err) {
    if (err) throw err

    var getFullTeams = require('./ghTeams').getFullTeams
    var github = require('./githubApiForToken')(options.githubApiToken)
    var exposePublicFields = require('./exposePublicFields')
    var hasWebhook = false
    var nextAutoUpdate = null
    var lastWebhook = null
    var expiresIn = 1000 * 60 * 60 * 24 * 20 // Cache the data for 20 days (note: hapi max: 2147483647)

    server.method('githubFullTeam', function (organization, next) {
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
      relativeTo: Path.join(__dirname, '..', 'web', 'templates')
    })

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
          var hmac = crypto.createHmac('sha256', options.webhookSecret)
          hmac.update(request.payload)
          var check = hmac.digest('hex')
          if (request.headers['x-hub-signature'] === check) {
            lastWebhook = new Date()
            server.methods.githubFullTeam.cache.drop(options.githubOrganization)
            reply({success: true})
          } else {
            reply({error: 'wrong-signature'})
          }
        }
      })
    }

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

    server.route({
      method: 'GET',
      path: '/teams.json',
      config: {
        cors: true
      },
      handler: function (req, reply) {
        server.methods.githubFullTeam(options.githubOrganization, function (err, data) {
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
        server.methods.githubFullTeam(options.githubOrganization, function (err, data) {
          if (err) {
            console.log(err)
          }
          reply.view('index', {
            org: options.githubOrganization,
            teams: data,
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
