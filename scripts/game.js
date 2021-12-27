let { getShape, getRandShape } = require('./shape.js')

let instance = null
exports.getGame = function () {
  if (!instance) {
    let n = 13
    instance = new Game(n, 2*n)
  }
  return instance
}
let maskType = {
  empty: 0,
  shape: 1,
  predict: 2,
  base: 3,
}
exports.maskType = maskType



class Game {
  constructor(xcount, ycount) {
    this.tickCount = 0
    this.isTurbo = false

    this.ctx = new InfoBoard()
    this.block = {
      base: new BaseBlock(xcount, ycount),
      curr: null,
      predict: null,
      nexts: [null],
    }

    this.xcount = xcount
    this.ycount = ycount

    this.maskVersion = 0
    this.allMasks = []
    this.masks = makeArr(ycount, y => {
      return makeArr(xcount, x => {
        let m = {x, y, version: this.maskVersion, type: maskType.empty}
        this.allMasks.push(m)
        return m
      })
    })
    this.renderForceUpdate = false

    this.midx = (xcount >> 1) - 2
    this.resetShape()
  }
  runTick() {
    this.tickCount++
    if (this.isTurbo || this.tickCount % this.level == 0) {
      let moved = this.moveCurrY(1,false)
      if (!moved) {
        this.updateBase()
      } else {
        this.ev.emit('render', this.getMasksDiff())
      }
    }
  }
  render(forceUpdate=true) {
    this.ev.emit('render', this.getMasksDiff(forceUpdate))
  }
  pause() {
    this.stopped = true
    this.ev.emit('pause')
  }
  restart() {
    this.clearBase()
    this.resetShape()
  }
  setRenderForceUpdate(b=false) {
    this.renderForceUpdate = b
  }
  getMasksDiff(forceUpdate=false) {
    let version = this.maskVersion++
    let changes = []

    if (forceUpdate || this.renderForceUpdate) {
      this.allMasks.forEach(m => {
        m.version = version
        m.type = this.empty
      })
    }

    // step1: fill base
    this.bases.forEach((base, y) => {
      base.forEach((mark, x) => {
        if (mark > 0) {
          let m = this.masks[y][x]
          if (m.type !== maskType.base) {
            m.type = maskType.base
            changes.push(m)
          }
          m.version = version
        }
      })
    })
    // step2: fill predict
    this.predict.shape.grids.forEach(grid => {
      let y = grid.y + this.predict.pos.y
      let x = grid.x + this.predict.pos.x
      if (y < 0 || y >= this.ycount) return
      if (x < 0 || x >= this.xcount) return
      let m = this.masks[y][x]
      if (m.type !== maskType.predict) {
        m.type = maskType.predict
        changes.push(m)
      }
      m.version = version
    })
    // step3: fill curr
    this.curr.shape.grids.forEach(grid => {
      let y = grid.y + this.curr.pos.y
      let x = grid.x + this.curr.pos.x
      if (y < 0 || y >= this.ycount) return
      if (x < 0 || x >= this.xcount) return
      let m = this.masks[y][x]
      if (m.type !== maskType.shape) {
        m.type = maskType.shape
        changes.push(m)
      }
      m.version = version
    })
    // step4: deleted grids
    this.allMasks.forEach(m => {
      if (m.version !== version && m.type !== maskType.empty) {
        m.version = version
        m.type = maskType.empty
        changes.push(m)
      }
    })

    return changes
  }
  setTurbo(flag) {
    this.isTurbo = flag
  }
  resetShape(type='I') {
    let xRange = [0, this.xcount]
    let yRange = [0, this.ycount]
    let next = () => {
      let x = this.midx
      let y = -shape.boundTop
      let shape = 'IOLJZST'.indexOf(type) >= 0 ? getShape(type) : getRandShape()
      return new Block(x, y, shape, xRange, yRange)
    }

    if (!this.next) {
      this.next = next()
    }
    this.curr = this.next
    this.next = next()
    this.predict = new Block(this.curr.x, this.curr.y, this.curr.shape, xRange, yRange)

    this.updatePredict()
    this.ev.emit('render', this.getMasksDiff())
  }
  updatePredict() {
    this.predict.y = this.curr.y
    while (this.predict.move(this.BASE, 0, 1)) {;}
  }
  dropCurr() {
    this.curr = this.predict
    this.updateBase()
  }
}

function makeArr(size, fill) {
  let arr = []
  for (let i = 0; i < size; i++) {
    if (typeof fill == 'function') {
      arr.push(fill(i))
    } else {
      arr.push(fill)
    }
  }
  return arr
}