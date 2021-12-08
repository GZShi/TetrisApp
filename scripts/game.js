let { getShape, getRandShape } = require('./shape.js')

let instance = null
exports.getGame = function () {
  if (!instance) {
    let n = 5
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

    this.score = 0
    this.combo = 0
    this.lines = 0
    this.level = 12
    this.levelUpLines = 10

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

    this.bases = makeArr(ycount, () => makeArr(xcount, 0))
    this.evCallbacks = {}
    this.midx = (xcount >> 1) - 2
    this.curr = null
    this.next = null
    this.predict = null
    this.resetShape()
  }
  listen(evname, callback) {
    this.evCallbacks[evname] = callback
  }
  emit(evname, payload) {
    let fn = this.evCallbacks[evname]
    if (typeof fn == 'function') {
      console.log(`√ emit event: '${evname}'`, payload)
      fn(payload)
    } else {
      console.log(`× emit event: '${evname}'`)
    }
  }
  runTick() {
    this.tickCount++
    if (this.isTurbo || this.tickCount % this.level == 0) {
      let moved = this.moveCurrY(1,false)
      if (!moved) {
        this.updateBase()
      } else {
        this.emit('render', this.getMasksDiff())
      }
    }
  }
  render() {
    this.emit('render', this.getMasksDiff(true))
  }
  pause() {
    this.stopped = true
    this.emit('pause')
  }
  restart() {
    this.clearBase()
    this.resetShape()
  }
  getMasksDiff(forceUpdate=false) {
    let version = this.maskVersion++
    let changes = []

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
    // step2: fill curr
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
    // step3: fill predict
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
    // step4: delete low verison
    this.masks.forEach((arr, y) => {
      arr.forEach((m, x) => {
        if (m.version !== version) {
          m.type = maskType.empty
          changes.push(m)
        }
      })
    })

    if (forceUpdate) {
      return this.allMasks
    }

    return changes
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
  clearLines(n) {
    if (n <= 0) return
    if (n == 4) {
      this.combo++
      this.emit('combo:changed', this.combo)
    } else {
      this.combo = 0
      this.emit('combo:changed', this.combo)
    }
    this.lines += n
    this.emit('lines:changed', this.lines)
    if (this.lines > this.levelUpLines) {
      this.levelUpLines *= 1.5
      this.levelUp(1)
    }

    this.score += (1 << (n-1)) * (1<<Math.min(this.combo, 5))
    this.emit('score:changed', this.score)
  }
  resetShape(type='I') {
    let next = () => {
      let shape = 'IOLJZST'.indexOf(type) >= 0 ? getShape(type) : getRandShape()
      return {
        pos: { x: this.midx, y: -shape.boundTop },
        shape
      }
    }

    if (!this.next) {
      this.next = next()
    }
    this.curr = this.next
    this.next = next()
    this.predict = {
      pos: {x: this.curr.pos.x, y:this.curr.pos.y},
      shape: this.curr.shape
    }

    this.updatePredict()
    this.emit('render', this.getMasksDiff())
  }
  updatePredict() {
    let oldy = this.curr.pos.y
    while (this.moveCurrY(1, false)) {}
    this.predict.pos.y = this.curr.pos.y
    this.curr.pos.y = oldy
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
      this.predict.pos.x = this.curr.pos.x
      if (triggerRender) {
        this.updatePredict()
        this.emit('render', this.getMasksDiff())
      }
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
      this.predict.pos.x = this.curr.pos.x
      if (triggerRender) {
        this.updatePredict()
        this.emit('render', this.getMasksDiff())
      }
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
      if (triggerRender) this.emit('render', this.getMasksDiff())
      return true
    }
  }
  dropCurr() {
    this.curr = this.predict
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
      arr.push(fill(i))
    } else {
      arr.push(fill)
    }
  }
  return arr
}