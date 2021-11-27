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

exports.initrender = () => {
  if (!render) {
    render = new RenderForConsole(game)
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
  console.log('GAME OVER')
  ctrl.tap('pause')
})
game.listen('render', () => render && render.draw())


//
// render
//
const fgYellow = '\x1b[33m'
const fgBlue = '\x1b[34m'
const fgWhite = '\x1b[37m'
class RenderForConsole {
  constructor(game) {
    this.game = game
    this.xcount = game.xcount
    this.ycount = game.ycount
    this.buffer = makeArr(this.ycount, () => makeArr(this.xcount, ''))
    this.frameCount = 0
  }

  draw() {
    this.drawBackground()
    this.drawLines()
    this.drawBases()
    this.drawShape()

    process.stdout.write('\x1Bc')
    console.log(`frameCount=${this.frameCount++} score=${this.game.score}`)
    console.log(makeArr(this.xcount*2 + 2, '▉').join(''))
    this.buffer.forEach(row => {
      console.log('▉' + row.map(color => color ? `${color}▉▉${fgWhite}` : '  ').join('') + '▉')
    })
    console.log(makeArr(this.xcount*2 + 2, '▉').join(''))
  }

  drawBackground() {
    this.buffer = makeArr(this.ycount, () => makeArr(this.xcount, ''))
  }
  drawLines() {
    // ignore
  }
  drawBases() {
    this.game.bases.forEach((base, y) => {
      base.forEach((mark, x) => {
        if (mark > 0) {
          this.drawGrid(x, y, fgYellow)
        }
      })
    })
  }
  drawShape() {
    let {pos, shape} = this.game.curr
    shape.grids.forEach(grid => {
      this.drawGrid(grid.x+pos.x, grid.y+pos.y, fgBlue)
    })
  }
  drawGrid(x, y, color=fgWhite) {
    if (x < 0 || y < 0) return
    if (x >= this.xcount || y >= this.ycount) return
    this.buffer[y][x] = color
  }
}

function makeArr(size, fill) {
  let arr = []
  for (let i = 0; i < size; i++) {
    if (typeof fill == 'function') {
      arr.push(fill())
    } else {
      arr.push(fill)
    }
  }
  return arr
}