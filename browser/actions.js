const {getGame} = require('../scripts/game')
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

exports.initrender = (div) => {
  if (!render) {
    render = new RenderForBrowser(div, game)
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
class RenderForBrowser {
  constructor(div, game) {
    console.log('new RenderForBrowser:', div, game)
    this.game = game
    this.div = div
    let style = getComputedStyle(div)
    this.xcount = game.xcount
    this.ycount = game.ycount
    this.w = parseInt(style.width, 10)
    this.h = parseInt(style.height, 10)
    this.gridw = this.w/this.xcount
    this.gridh = this.h/this.ycount

    console.log(style.width, this.w, style.height, this.h, this.xcount, this.ycount)
  }

  draw() {
    this.drawBackground()
    this.drawLines()
    this.drawBases()
    this.drawShape()
  }

  drawBackground() {
    this.div.style.background = '#1d1f23'
    this.div.innerHTML = ''
  }
  drawLines() {
    // ignore
  }
  drawBases() {
    this.game.bases.forEach((base, y) => {
      base.forEach((mark, x) => {
        if (mark > 0) {
          this.drawGrid(x, y, '#c7b77b')
        }
      })
    })
  }
  drawShape() {
    let {pos, shape} = this.game.curr
    shape.grids.forEach(grid => {
      this.drawGrid(grid.x+pos.x, grid.y+pos.y, '#61afef')
    })
  }
  drawGrid(x, y, color='#fff') {
    let margin = 2
    let left = x*this.gridw + margin
    let top = y*this.gridh + margin
    let w = this.gridw - 2*margin
    let h = this.gridh- 2*margin
    
    let grid = document.createElement('div')
    grid.style.position = 'absolute'
    grid.style.left = `${left}px`
    grid.style.top = `${top}px`
    grid.style.width = `${w}px`
    grid.style.height = `${h}px`
    grid.style.background = color

    this.div.appendChild(grid)

    // console.log(`draw grid: (${left},${top},${w},${h})`)
  }
}