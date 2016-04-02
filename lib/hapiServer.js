'use strict'

var hapi = require('hapi')

module.exports = function (options, callback) {
  if (!options.openGithubTeams.secret) {
    options.connection.httpOnly = true
  }

  var server = new hapi.Server()
  server.connection(require('./hapiConnection.js')(options.connection))
  server.register([{
    register: require('good'),
    options: {
      opsInterval: 1000,
      reporters: [{
        reporter: require('good-console'),
        events: { log: '*', response: '*' }
      }]
    }
  }, {
    register: require('./hapiPlugin.js'),
    options: options.openGithubTeams
  }], function (err) {
    callback(err, server)
  })
}
