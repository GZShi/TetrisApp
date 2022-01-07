let { getShape, getRandShape } = require('./shape.js')
let { makeArray } = require('./utils.js')
let { InfoBoard } = require('./infoBoard.js')
let { BaseBlock } = require('./baseBlock.js')
let { Block } = require('./block.js')
let { Event } = require('./evbase.js')
let { Render } = require('./render.js')
let { Ticker } = require('./ticker.js')

class Game {
  constructor(xcount, ycount) {
    this.ev = new Event()
    this.ticker = new Ticker()
    this.state = 'uninit'
    this.xcount = xcount
    this.ycount = ycount
    this.r = new Render(xcount, ycount)

    this.info = new InfoBoard()
    this.block = {
      base: new BaseBlock(xcount, ycount),
      curr: null,
      predict: null,
      nexts: [],
    }
  }
  listen(evName, callback) {
    return this.ev.listen(evName, callback)
  }
  render() {
    console.log('手动渲染')
  }

  makeBlock(type) {
    let shape = 'IOLJZST'.indexOf(type) >= 0 ? getShape(type) : getRandShape()
    let x = (this.xcount >> 1) - 2
    let y = -shape.boundTop
    return new Block(x, y, shape, [0, this.xcount], [0, this.ycount])
  }

  updateCurrBlock() {
    if (this.block.nexts.length <= 0) {
      this.block.nexts.push(this.makeBlock())
    }

    this.block.curr = this.block.nexts.shift()
    this.block.curr.type = 'block'

    this.block.nexts.push(this.makeBlock())
    this.updatePredictPos()
  }

  updatePredictPos() {
    this.block.predict = this.block.curr.getDropPredict(this.block.base)
    this.updateView()
  }

  updateView() {
    let blocks = [
      this.block.base,
      this.block.predict,
      this.block.curr,
    ]
    let changes = this.r.update(blocks)
    this.ev.emit('render', changes)
  }

  stepover() {
    if (this.state != 'running') return

    // move curr block
    let moved = this.block.curr.move(this.block.base, 0, 1)
    if (!moved) {
      this.block.base.mergeBlock(this.block.curr)
      this.updateCurrBlock()
      return
    }

    this.updateView()
  }

  getController() {
    let self = this
    let wrapPredictUpdater = (actionFunc) => {
      return function () {
        let moved = actionFunc()
        if (moved) {
          self.updatePredictPos()
        }
        return moved
      }
    }
    let left = wrapPredictUpdater(() => self.state === 'running' && self.block.curr.move(self.block.base, -1, 0))
    let right = wrapPredictUpdater(() => self.state === 'running' && self.block.curr.move(self.block.base, 1, 0))
    let rotate = wrapPredictUpdater(() => self.state === 'running' && self.block.curr.rotate(self.block.base))
    let turboOn = () => { self.state === 'running' && self.ticker.turboOn() }
    let turboOff = () => { self.state === 'running' && self.ticker.turboOff() }
    let drop = () => {
      if (self.state !== 'running') return false
      self.block.curr = self.block.predict
      self.block.base.mergeBlock(self.block.curr)
      self.updateCurrBlock()
      return true
    }
    let start = () => {
      switch (self.state) {
      case 'uninit':
        reset()
        start()
        break
      case 'running': break
      case 'paused':
        self.state = 'running';
        self.ticker.run(() => self.stepover())
        break
      case 'stopped':
        reset()
        start()
        break
      }
    }
    let pause = () => {
      switch (self.state) {
      case 'uninit': break
      case 'running':
        self.state = 'paused';
        self.ticker.stop()
        break
      case 'paused': break
      case 'stopped': break
      }
    }
    let reset = () => {
      self.ticker.stop()
      self.state = 'paused'
      self.info = new InfoBoard()
      self.block = {
        base: new BaseBlock(self.xcount, self.ycount),
        curr: null,
        predict: null,
        nexts: makeArray(5, () => self.makeBlock())
      }
      self.updateCurrBlock()
    }

    return {left, right, rotate, turboOn, turboOff, drop, start, pause, reset }
  }
}

module.exports.Game = Game