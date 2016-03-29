
var hapi = require('hapi')

module.exports = function (options, callback) {
  var conn

  if (options.openGithubTeams.secret && (options.connection.httpOnly || '').toLowerCase() !== 'true') {
    var createServer = require('auto-sni')
    conn = {
      listener: createServer({
        // we need SSL for the webhook but the access is just-fine™ via http
        forceSSL: false,
        email: options.connection.email,
        agreeTos: options.connection.agreeTos === 'yes',
        ports: {
          http: options.connection.http || 80,
          https: options.connection.https || 443
        }
      }),
      autoListen: false,
      tls: true
    }
  } else {
    conn = {
      port: options.connection.http || 80
    }
  }

  var server = new hapi.Server()
  server.connection(conn)
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
