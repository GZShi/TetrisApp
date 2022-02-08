let { getShape, getRandShape, setSeed } = require('./shape.js')
let { makeArray } = require('./utils.js')
let { InfoBoard } = require('./infoBoard.js')
let { BaseBlock } = require('./baseBlock.js')
let { Block } = require('./block.js')
let { Event } = require('./evbase.js')
let { Render } = require('./render.js')
let { Ticker } = require('./ticker.js')
let { Recorder } = require('./recorder.js')

class Game {
  constructor(xcount, ycount) {
    this.ev = new Event()
    this.ticker = new Ticker()
    this.state = 'uninit'
    this.xcount = xcount
    this.ycount = ycount
    this.r = new Render(xcount, ycount)
    this.recorder = new Recorder()
    this.mode = 'game' // or 'replay'

    resetGameState(this)
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
    if (this.recorder) {
      this.recorder.record('stepover')
    }

    // move curr block
    let moved = this.block.curr.move(this.block.base, 0, 1)
    if (!moved) {
      let collapsed = this.block.base.mergeBlock(this.block.curr)
      if (collapsed) {
        this.ticker.stop()
        this.state = 'stopped'
        setTimeout(() => {
          this.ev.emit('gameover')
          if (this.recorder) {
            this.recorder.print()
          }
        }, 10)
        this.updateView()
        return
      }
      this.updateCurrBlock()
      return
    }

    this.updateView()
  }

  getController() {
    let self = this
    let wrap = ({
      shouldUpdatePredict=false,
      shouldCheckState=true,
      shouldCheckRecorder=true,
      actionName,
      actionParams=[],
      actionFunc
    }) => {
      return function () {
        if (!shouldCheckState || self.state === 'running') {
          if (shouldCheckRecorder && self.recorder) {
            self.recorder.record(actionName, actionParams)
          }
          let moved = actionFunc.apply(this, actionParams)
          if (shouldUpdatePredict && moved) {
            self.updatePredictPos()
          }
        }
      }
    }
    let left = wrap({
      shouldUpdatePredict: true,
      shouldCheckState: true,
      shouldCheckRecorder: true,
      actionName: 'left',
      actionFunc: () => self.block.curr.move(self.block.base, -1, 0)
    })
    let right = wrap({
      shouldUpdatePredict: true,
      shouldCheckState: true,
      shouldCheckRecorder: true,
      actionName: 'right',
      actionFunc: () => self.block.curr.move(self.block.base, 1, 0)
    })
    let rotate = wrap({
      shouldUpdatePredict: true,
      shouldCheckState: true,
      shouldCheckRecorder: true,
      actionName: 'rotate',
      actionFunc: () => self.block.curr.rotate(self.block.base)
    })
    let drop = wrap({
      shouldUpdatePredict: false,
      shouldCheckState: true,
      shouldCheckRecorder: true,
      actionName: 'drop',
      actionFunc: () => {
        self.block.curr = self.block.predict
        self.block.base.mergeBlock(self.block.curr)
        self.updateCurrBlock()
        return true
      }
    })
    let turboOn = wrap({
      shouldUpdatePredict: false,
      shouldCheckState: true,
      shouldCheckRecorder: false,
      actionName: 'turboOn',
      actionFunc: () => self.ticker.turboOn()
    })
    let turboOff = wrap({
      shouldUpdatePredict: false,
      shouldCheckState: true,
      shouldCheckRecorder: false,
      actionName: 'turboOff',
      actionFunc: () => self.ticker.turboOff()
    })
    let startFunc = (seed=5) => {
      debugger
      self.ev.emit('change:info', self.info.cleanLines(0))
      switch (self.state) {
      case 'uninit':
        resetFunc(seed)
        startFunc()
        break
      case 'running': break
      case 'paused':
        self.state = 'running'
        if (self.mode === 'game') {
          self.ticker.run(() => self.stepover())
        }
        break
      case 'stopped':
        resetFunc(seed)
        startFunc()
        break
      }
    }
    let pauseFunc = () => {
      switch (self.state) {
      case 'uninit': break
      case 'running':
        self.state = 'paused'
        if (self.mode === 'game') {
          self.ticker.stop()
        }
        break
      case 'paused': break
      case 'stopped': break
      }
    }
    let resetFunc = (replayMode=false, seed=5) => {
      if (!replayMode) {
        self.ticker.stop()
      }
      self.state = 'paused'
      resetGameState(self, seed)
      self.updateCurrBlock()
    }
    let start = wrap({
      shouldUpdatePredict: false,
      shouldCheckState: false,
      shouldCheckRecorder: true,
      actionName: 'start',
      actionFunc: startFunc
    })
    let pause = wrap({
      shouldUpdatePredict: false,
      shouldCheckState: false,
      shouldCheckRecorder: true,
      actionName: 'pause',
      actionFunc: pauseFunc
    })
    let reset = wrap({
      shouldUpdatePredict: false,
      shouldCheckState: false,
      shouldCheckRecorder: true,
      actionName: 'reset',
      actionFunc: resetFunc
    })
    let seed = wrap({
      shouldUpdatePredict: false,
      shouldCheckState: false,
      shouldCheckRecorder: true,
      actionName: 'setSeed',
      actionParams: [5],
      actionFunc: (s) => {
        setSeed(s)
      }
    })

    return {left, right, rotate, turboOn, turboOff, drop, start, pause, reset, seed }
  }
}

function resetGameState(game, seed=5) {
  let base = new BaseBlock(game.xcount, game.ycount)
  let info = new InfoBoard()

  game.info = info
  game.block = {
    base,
    curr: null,
    predict: null,
    nexts: makeArray(5, () => game.makeBlock())
  }

  base.ev.listen('cleanLines', n => {
    let payload = info.cleanLines(n)
    game.ev.emit('change:info', payload)
    game.ticker.setLevel(payload.level)
  })
}

module.exports.Game = Game