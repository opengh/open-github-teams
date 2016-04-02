
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
  if (typeof pageNr === 'function') {
    callback = pageNr
    pageNr = 1
  }
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
module.exports = getGithubList
