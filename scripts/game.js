let { getShape, getRandShape } = require('./shape.js')

let instance = null
exports.getGame = function () {
  if (!instance) {
    instance = new Game(10, 20)
  }
  return instance
}

class Game {
  constructor(xcount, ycount) {
    this.tickInterval = 0.08
    this.tickCount = 0
    this.isTurbo = false

    this.score = 0
    this.lines = 0
    this.level = 12
    this.levelUpLines = 10

    this.xcount = xcount
    this.ycount = ycount

    this.midx = (xcount >> 1) - 2
    this.curr = {
      pos: null,
      shape: null
    }
    this.nextShape = getRandShape()
    this.resetShape()

    this.bases = makeArr(ycount, () => makeArr(xcount, 0))
    this.callbacks = {}
  }
  listen(evname, callback) {
    this.callbacks[evname] = callback
  }
  emit(evname, payload) {
    let fn = this.callbacks[evname]
    if (typeof fn == 'function') {
      fn(payload)
    }
  }
  runTick() {
    this.tickCount++
    if (this.isTurbo || this.tickCount % this.level == 0) {
      let moved = this.moveCurrY(1,false)
      if (!moved) {
        this.updateBase()
      } else {
        this.emit('render')
      }
    }
  }
  start() {
    if (this.stopped) {
      this.stopped = false
      this.emit('start')
    }
  }
  pause() {
    if (this.timer) {
      this.timer.invalidate()
      this.timer = null
      this.emit('pause')
    }
  }
  restart() {
    this.clearBase()
    this.resetShape()
  }
  levelUp(n) {
    this.level -= n
    if (this.level < 1) {
      this.level = 1
    }
    this.emit('level:changed', 13-this.level)
  }
  setTurbo(flag) {
    this.isTurbo = flag
  }

  resetCurrPos() {
    this.curr.pos = {x:this.midx, y: -2}
  }
  refreshCurrShape() {
    this.curr.shape = this.nextShape
    this.nextShape = getRandShape()
  }
  clearLines(n) {
    if (n <= 0) return
    this.lines += n
    this.emit('lines:changed', this.lines)
    if (this.lines > this.levelUpLines) {
      this.levelUpLines *= 1.5
      this.levelUp(1)
    }

    this.score += (1 << (n-1))
    this.emit('score:changed', this.score)
  }
  resetShape() {
    this.resetCurrPos()
    this.refreshCurrShape()
  }
  updateBase() {
    let clears = []
    this.curr.shape.grids.forEach(({x, y}) => {
      let baseY = y+this.curr.pos.y
      let baseX = x+this.curr.pos.x
      let base = this.bases[baseY]
      if (!base) {
        return
      }
      base[baseX] = 1

      if (base.every(m => m > 0)) {
        clears.push(baseY)
      }
    })
    if (clears.length > 0) {
      clears.sort((a, b) => a - b)
      clears.forEach(y => {
        this.bases.splice(y, 1)
        this.bases.unshift(makeArr(this.xcount, 0))
      })
      this.clearLines(clears.length)
    }
    this.resetShape()
    this.emit('render')

    if (this.hasHitBase) {
      this.pause()
      this.emit('gameover')
      return
    }
  }
  // 旋转活动块
  rotateCurr(triggerRender=true) {
    let oldpos = {x: this.curr.pos.x, y: this.curr.pos.y }
    this.curr.shape.rotate()

    // 检测变形后是否会出边界
    let leftGap = this.currLeftGapSize
    let rightGap = this.currRightGapSize
    if (leftGap < 0) {
      this.curr.pos.x += (-leftGap)
    }
    if (rightGap < 0) {
      this.curr.pos.x += rightGap
    }

    // 先检测是否会碰到底部，如果会碰到，则回滚变化
    if (this.hasHitBase) {
      this.curr.pos = oldpos
      this.curr.shape.rotate(-1)
      return false
    } else {
      if (triggerRender) this.emit('render')
      return true
    }
  }
  // 横向移动活动块
  moveCurrX(offset, triggerRender=true) {
    let oldx = this.curr.pos.x
    if (offset <= 0) {
      offset = Math.max(offset, -this.currLeftGapSize)
    } else {
      offset = Math.min(offset, this.currRightGapSize)
    }
    this.curr.pos.x += offset

    if (this.hasHitBase) {
      this.curr.pos.x = oldx
      return false
    } else {
      if (triggerRender) this.emit('render')
      return true
    }
  }
  // 纵向移动活动块
  moveCurrY(n, triggerRender=true) {
    let oldy = this.curr.pos.y
    let offset = n
    if (n <= 0) {
      offset = Math.max(n, -this.currTopGapSize)
    } else {
      offset = Math.min(n, this.currBottomGapSize)
    }
    if (n != 0 && offset == 0) {
      return false
    }
    this.curr.pos.y += offset

    if (this.hasHitBase) {
      this.curr.pos.y = oldy
      return false
    } else {
      if (triggerRender) this.emit('render')
      return true
    }
  }
  dropCurr() {
    while (this.moveCurrY(1, false)) {
      // continue drop
    }
    this.updateBase()
  }
  // 活动块距离左边框的剩余格子数（可左移距离）
  get currLeftGapSize()   { return this.curr.pos.x + this.curr.shape.boundLeft }
  get currRightGapSize()  { return (this.xcount - 1) - (this.curr.pos.x + this.curr.shape.boundRight) }
  get currTopGapSize()    { return this.curr.pos.y + this.curr.shape.boundTop }
  get currBottomGapSize() { return (this.ycount - 1) - (this.curr.pos.y + this.curr.shape.boundBottom) }
  get hasHitBase() {
    if (this.currBottomGapSize < 0) return true
    if (this.curr.shape.grids.some(({x, y}) => {
      let baseY = y+this.curr.pos.y
      let baseX = x+this.curr.pos.x
      if (baseY >= 0 && baseX >= 0) {
        return this.bases[baseY][baseX] > 0
      }
      return false
    })) {
      return true
    }
    return false
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