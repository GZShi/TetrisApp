;(function () {
  //
  // Simple CommonJS Polyfill
  // See: https://nodejs.org/api/modules.html
  //

  window.$loadModule = function (moduleName) {
    return asyncRequire('.', moduleName)
  }
  window.$listModules = function () {
    return modules
  }

  let modules = {}
  async function asyncRequire(root, pathname) {
    let {moduleName, dir, filename} = resolveModuleName(root, pathname)
    if (modules[moduleName]) {
      return modules[moduleName].exports
    }

    console.log(`loading module: moduleName="${moduleName}" root="${root}" pathname="${pathname}"`)
    
    let raw = await loadModuleRaw(moduleName)
    let injected = injectRequireToModuleRaw(raw, dir)
    let module = await execModuleRaw(dir, filename, injected)
    modules[moduleName] = module
    return module.exports
  }

  // loadModuleRaw 加载原始脚本
  async function loadModuleRaw(moduleName) {
    let resp = await fetch(moduleName)
    let text = await resp.text()
    return text
  }

  // injectRequireToModuleRaw 向原始脚本注入CommandJS的变量
  function injectRequireToModuleRaw(raw, dir='') {
    let reg = /([^a-zA-Z0-9_])require(\s*\()/g
    raw = raw.replace(reg, (s, s1, s2) => {
      return `${s1}await require${s2}${JSON.stringify(dir)},`
    })
    return raw
  }

  // execModuleRaw 执行模块的工厂方法，生成模块
  let AsyncFn = Object.getPrototypeOf(async function () {}).constructor
  async function execModuleRaw(__dirname, __filename, raw) {
    let exports = {}
    let factory = new AsyncFn(
      'exports',
      'require',
      'module',
      '__filename',
      '__dirname',
      'global',
      raw)
    let module = {
      path: __dirname,
      filename: __filename,
      exports, raw, factory
    }

    await factory(exports, asyncRequire, module, __filename, __dirname, this)
    return module
  }

  // resolveModuleName 解析模块的名字信息
  function resolveModuleName(dir='.', fileName='index.js') {
    // resolve js file
    if (!/.*\.js$/i.test(fileName)) {
      fileName = fileName + '.js'
    }
    // resolve .ux for jsbox
    if (/.*\.ux$/i.test(dir)) {
      dir = dir + '/..'
    }

    return resolvePath(dir, fileName)
  }

  // resolvePath 解析路径
  let aobj = document.createElement('a')
  function resolvePath(...parts) {
    aobj.href = parts.join('/')

    let pathname = aobj.pathname
    let lastIndexOfSlash = pathname.lastIndexOf('/')
    if (lastIndexOfSlash < 0) {
      return {dir: '.', fileName: pathname}
    }
    return {
      moduleName: pathname,
      dir: pathname.substr(0, lastIndexOfSlash) || '.',
      fileName: pathname.substr(lastIndexOfSlash + 1) || 'index.js'
    }
  }
})()