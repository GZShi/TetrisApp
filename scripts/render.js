
let { makeArray } = require('./utils.js')
class Render {
  constructor(xcount, ycount) {
    this.bits = []
    this.bitTable = makeArray(ycount, y => makeArray(xcount, x => {
      let bit = {
        type: 'blank',
        version: 0,
      }
      this.bits.push(bit)
      return bit
    }))

    this.version = 0
  }

  update(blocks, forceUpdate=false) {
    if (forceUpdate) {
      this.bits.forEach(bit => {
        bit.version = 0
        bit.type = 'blank'
      })
    }
    let changes = []
    let version = this.version++
    blocks.forEach(block => {
      block.forEachGrid((absX, absY, grid) => {
        let bits = this.bitTable[absY]
        if (!bits) return
        let bit = d[absX]
        if (!bit) return

        bit.version = version
        if (bit.type !== grid.type) {
          bit.action = (bit.type === 'blank' ? 'add' : 'change')
          bit.type = grid.type
          changes.push(bit)
        }
      })
    })

    this.bits.forEach(bit => {
      if (bit.version !== version && bit.type !== 'blank') {
        bit.version = version
        bit.type = 'blank'
        bit.action = 'remove'
        changes.push(bit)
      }
    })

    return changes
  }
}

module.exports.Render = Render