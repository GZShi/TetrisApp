module.exports.makeArray = function (n, fn) {
  let isFunction = typeof fn === 'function'
  let ret = []
  for (let i = 0; i < n; i++) {
    if (isFunction) {
      ret.push(fn(i))
    } else {
      ret.push(fn)
    }
  }
}