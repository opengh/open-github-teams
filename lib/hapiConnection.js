'use strict'

module.exports = function (options) {
  if (options.httpOnly) {
    return {
      port: options.http || 80
    }
  }
  var createServer = require('auto-sni')
  return {
    listener: createServer({
      // we need SSL for the webhook but the access is just-fine™ via http
      forceSSL: false,
      email: options.email,
      agreeTos: options.agreeTos,
      ports: {
        http: options.http,
        https: options.https
      }
    }),
    autoListen: false,
    tls: true
  }
}
