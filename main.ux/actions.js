const {getGame, maskType} = require('./scripts/game')
const {getControl} = require('../scripts/control')

let game = getGame()
let ctrl = getControl()
let render = null

//
// control inputs
//
ctrl.bindGame(game)
exports.tapleft = () => ctrl.tap('left')
exports.tapup = () => ctrl.tap('top')
exports.tapright = () => ctrl.tap('right')
exports.tapdownbegan = () => ctrl.tap('bottom:began')
exports.tapdownend = () => ctrl.tap('bottom:end')
exports.taprotate = () => ctrl.tap('rotate')
exports.tapdrop = () => ctrl.tap('drop')
exports.tappause = () => ctrl.tap('pause')
exports.tapstart = () => ctrl.tap('start')

exports.debugstep = () => ctrl.tap('debug:step')
exports.debugup = () => ctrl.tap('debug:up')
exports.debugdown = () => ctrl.tap('debug:down')

exports.initrender = (view, ctx) => {
  if (!render) {
    console.log('init render')
    render = new RenderForJSBox(view, ctx, game)
  }
  render.draw()
}

//
// game events
//
game.listen('score:changed', score => {
  $('scorelabel').text = `得分：${String(score).padStart(4, '0')}`
})
game.listen('lines:changed', lines => {
  $('lineslabel').text = `行数：${String(lines).padStart(4, '0')}`
})
game.listen('combo:changed', combo => {
  $('combolabel').text = `连击：${String(combo).padStart(4, '0')}`
})
game.listen('level:changed', level => {
  $('levellabel').text = `等级：${String(level).padStart(4, '0')}`
})
game.listen('gameover', () => {
  alert(`gameover`)
  ctrl.tap('pause')
})
game.listen('render', (changes) => render && render.storeChanges(changes))
game.setRenderForceUpdate(true)

//
// render
//
class RenderForJSBox {
  constructor(view, ctx, game) {
    this.game = game
    this.view = view
    this.ctx = ctx
    this.xcount = game.xcount
    this.ycount = game.ycount
    this.w = view.frame.width
    this.h = view.frame.height
    this.gridw = this.w/this.xcount
    this.gridh = this.h/this.ycount
    this.firstRender = true
    this.color = {
      empty: $color('#1d1f23'),
      base: $color('#c7b77b'),
      shape: $color('#61afef'),
      predict: $color('#444444')
    }
    this.changes = []
  }

  storeChanges(changes) {
    this.changes = changes || []
    this.view.runtimeValue().invoke('setNeedsDisplay')
  }
  draw() {
    if (!this.view || !this.ctx) return

    this.drawBackground()
    this.drawLines()
    
    let changes = this.changes || []
    changes.forEach(({x,y,type}) => {
      switch(type) {
        case maskType.base: this.drawGrid(x, y, this.color.base); break;
        case maskType.shape: this.drawGrid(x, y, this.color.shape); break;
        case maskType.predict: this.drawGrid(x, y, this.color.predict); break;
        case maskType.empty: this.drawGrid(x, y, this.color.empty); break;
        default:
      }
    })
    console.log(`draw changes=${changes.length}`)
  }

  drawBackground() {
    this.ctx.fillColor = $color('#1d1f23')
    this.ctx.fillRect($rect(0, 0, this.w, this.h))
  }
  drawLines() {
    this.ctx.beginPath()
    this.ctx.setLineWidth(.5)
    this.ctx.strokeColor = $color('#3b4048')
    for (let x = 1; x < this.xcount; x++) {
      this.ctx.moveToPoint(x * this.gridw, 0)
      this.ctx.addLineToPoint(x * this.gridw, this.h)
    }
    for(let y = 1; y < this.ycount; y++) {
      this.ctx.moveToPoint(0, y * this.gridh)
      this.ctx.addLineToPoint(this.w, y * this.gridh)
    }
    this.ctx.strokePath()
    this.ctx.closePath()
  }
  drawGrid(x, y, color) {
    this.ctx.fillColor = color
    let margin = 2
    let posx = x*this.gridw + margin
    let posy = y*this.gridh + margin
    let w = this.gridw - 2*margin
    let h = this.gridh - 2*margin
    this.ctx.fillRect($rect(posx, posy, w, h))
  }
}