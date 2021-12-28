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
  }

  makeBlock(type) {
    let shape = 'IOLJZST'.indexOf(type) >= 0 ? getShape(type) : getRandShape()
    let x = (xcount >> 1) - 2
    let y = -shape.boundTop
    return new Block(x, y, shape, xRange, yRange)
  }

  updateCurrBlock() {
    this.block.curr = this.block.nexts.shift()
    this.block.nexts.push(this.makeBlock('I'))
    this.updatePredictPos()
  }

  updatePredictPos() {
    this.block.predict = this.block.curr.getDropPredict(this.block.base)
  }

  runTick() {
    this.tickCount++
    if (this.tickCount % this.level !== 0 && !this.isTurbo) {
      return
    }

    // move curr block
    let moved = this.block.curr.move(this.block.base, 1, 0)

    if (!moved) {
      this.block.base.mergeBlock(this.block.curr)
      this.updateCurrBlock()
    }

    this.ev.emit('render')
  }
  pause() {
    this.stopped = true
    this.ev.emit('pause')
  }
  restart() {
    this.clearBase()
    this.resetShape()
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