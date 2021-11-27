const {getGame} = require('./scripts/game')
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
game.listen('gameover', () => {
  alert(`gameover`)
  ctrl.tap('pause')
})
game.listen('render', () => render && render.draw())


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
  }

  draw() {
    if (!this.view || !this.ctx) return

    this.drawBackground()
    this.drawLines()
    this.drawBases()
    this.drawShape()

    this.view.runtimeValue().invoke('setNeedsDisplay')
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
  drawBases() {
    this.ctx.fillColor = $color('#c7b77b')
    this.game.bases.forEach((base, y) => {
      base.forEach((mark, x) => {
        if (mark > 0) this.drawGrid(x, y)
      })
    })
  }
  drawShape() {
    this.ctx.fillColor = $color('#61afef')
    let {pos, shape} = this.game.curr
    shape.grids.forEach(grid => {
      this.drawGrid(grid.x+pos.x, grid.y+pos.y)
    })
  }
  drawGrid(x, y) {
    let margin = 2
    this.ctx.fillRect($rect(
      x*this.gridw + margin,
      y*this.gridh + margin,
      this.gridw - 2*margin,
      this.gridh- 2*margin
    ))
  }
}