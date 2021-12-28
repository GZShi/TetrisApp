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
      nexts: [null],
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

  stepover() {
    if (this.state != 'running') return

    // move curr block
    let moved = this.block.curr.move(this.block.base, 0, 1)
    if (!moved) {
      this.block.base.mergeBlock(this.block.curr)
      this.updateCurrBlock()
    }

    this.ev.emit('render')
  }

  getController() {
    let wrapPredictUpdater = (actionFunc) => {
      let moved = actionFunc()
      if (moved) {
        this.updatePredictPos()
        this.ev.emit('render')
      }
      return moved
    }
    let self = this
    return {
      left: wrapPredictUpdater(() => self.state === 'running' && self.block.curr.move(self.block.base, -1, 0)),
      right: wrapPredictUpdater(() => self.state === 'running' && self.block.curr.move(self.block.base, 1, 0)),
      rotate: wrapPredictUpdater(() => self.state === 'running' && self.block.curr.move(self.block.base)),
      turboOn() { self.state === 'running' && self.ticker.turboOn() },
      turboOff() { self.state === 'running' && self.ticker.turboOff() },
      drop() {
        if (self.state !== 'running') return false
        self.block.curr = self.block.predict
        self.block.base.mergeBlock(self.block.curr)
        self.updateCurrBlock()
        self.ev.emit('render')
        return true
      },
      start() {
        debugger
        switch (self.state) {
        case 'uninit':
          self.reset()
          self.start()
          break
        case 'running': break
        case 'paused':
          self.state = 'running';
          self.ticker.run(() => self.stepover())
          break
        case 'stopped':
          self.reset()
          self.start()
          break
        }
      },
      pause() {
        switch (self.state) {
        case 'uninit': break
        case 'running':
          self.state = 'paused';
          self.ticker.stop()
          break
        case 'paused': break
        case 'stopped': break
        }
      },
      reset() {
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
      },
    }
  }
}

module.exports.Game = Game