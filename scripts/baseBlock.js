let { makeArray } = require('./utils.js')
let { Event } = require('./evbase.js')

class BaseBlock {
  constructor(xcount, ycount) {
    this.ev = new Event()
    this.xcount = xcount
    this.ycount = ycount

    this.grids = makeArray(ycount, y => makeArray(xcount, null))
    this.type = 'base'
  }

  // 返回值是：是否出现形状重叠
  mergeBlock(block) {
    let collapsed = false
    let merged = false
    let cleans = []
    block.forEachGrid((absX, absY, grid) => {
      let row = this.grids[absY]
      if (!row) return

      if (row[absX]) {
        collapsed = true
      } else {
        row[absX] = grid
        merged = true
      }

      console.log(`merged: absX=${absX} absY=${absY}`)

      // 判断当前行是否完整了
      if (row.every(grid => grid)) {
        cleans.push(absY)
      }
    })

    if (cleans.length > 0) {
      cleans.sort((a, b) => a - b)
      cleans.forEach(y => {
        let [removed] = this.grids.splice(y, 1)
        for (let i = 0, len = removed.length; i < len; i++) {
          removed[i] = null
        }
        this.grids.unshift(removed)
      })
      this.ev.emit('cleanLines', cleans.length)
    }
    if (merged) {
      this.ev.emit('mergeBlock', this.grids)
    }

    return collapsed
  }

  move() { return false } // can't move
  rotate() { return false } // can't rotate
  checkOverflowX() { return false }
  checkOverflowY() { return false }


  //
  forEachGrid(fn) {
    this.grids.forEach((d, y) => {
      d.forEach((grid, x) => {
        if (grid) {
          fn(x, y, grid)
        }
      })
    })
  }
  atAbsolutePos(absX, absY) {
    if (this.grids[absY]) return this.grids[absY][absX]
    return null
  }
  at(x, y) {
    return this.atAbsolutePos(x, y)
  }
}

module.exports.BaseBlock = BaseBlock