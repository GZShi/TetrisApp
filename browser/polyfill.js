let AsyncFunction = Object.getPrototypeOf(async function() {}).constructor
let modules = {}
let modcount = 0
async function require(dirname, filename) {
  if (!/.*\.[jJ][sS]$/.test(filename)) {
    filename = filename + '.js'
  }
  if (/.*\.[uU][xX]$/.test(dirname)) {
    dirname = dirname + '/..'
  }
  let path = pathJoin(dirname, filename)
  let currdirname = getDirname(path)

  if (modules[path]) return modules[path].exports

  let mod = {
    exports: {},
    raw: '',
    fn: null
  }
  console.log(`load module: path='${path}' dir='${dirname}' name='${filename}'`)
  let resp = await fetch(path)
  let text = await resp.text()
  text = text.replace(/([^a-zA-Z0-9_])require(\s*\()/g, (s, s1, s2) => `${s1}await require${s2}${JSON.stringify(currdirname)},`)
  let fn = new AsyncFunction ('module', 'exports', 'require', 'global', text)
  mod.raw = text
  mod.fn = fn

  await fn(mod, mod.exports, require, this)
  modules[path] = mod

  return mod.exports
}
function pathJoin(...parts) {
  let a = document.createElement('a')
  a.href = parts.join('/')
  return a.pathname
}
function getDirname(path) {
  let parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

$color = function (str) { return str }