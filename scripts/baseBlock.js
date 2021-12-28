let { makeArray } = require('./utils.js')

class BaseBlock {
  constructor(xcount, ycount) {
    this.xcount = xcount
    this.ycount = ycount

    this.grids = makeArray(ycount, y => makeArray(xcount, null))
  }

  mergeBlock(block) {
    let merged = false
    let cleans = []
    block.forEachGrid(d => {
      let {absX, absY, grid} = d
      let row = this.grids[absY]
      if (!row) return

      row[absX] = grid
      merged = true

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
      this.ev.emit('mergeBlock')
    }
  }

  move() { return false } // can't move
  rotate() { return false } // can't rotate
  checkOverflowX() { return false }
  checkOverflowY() { return false }

  atAbsolutePos(absX, absY) {
    if (this.grids[absY]) return this.grids[absY][absX]
    return null
  }
  at(x, y) {
    return this.atAbsolutePos(x, y)
  }
}

module.exports.BaseBlock = BaseBlock