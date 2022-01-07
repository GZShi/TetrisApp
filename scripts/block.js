class Block {
  constructor(x, y, shape, xRange, yRange) {
    this.canTransform = true
    this.x = x
    this.y = y
    this.shape = shape
    this.xRange = xRange
    this.yRange = yRange
    this.type = 'block'
  }

  // 生成预览
  getDropPredict(baseBlock) {
    let predict = new Block(this.x, this.y, this.shape, this.xRange, this.yRange)
    predict.type = 'predict'
    let moved = false
    do {
      moved = predict.move(baseBlock, 0, 1)
    } while (moved)

    return predict
  }

  // move
  // 将block按偏移量进行移动
  // 如果目标位置没有与baseBlock重叠，返回成功
  // 否则返回失败
  // 失败时状态不会发生变化
  move(baseBlock, offsetX, offsetY) {
    if (!this.canTransform) return false
    if (!this.shape.grids) return false  // shape不支持grids变量

    // 先判断是否X越界
    let ox = this.checkOverflowX(offsetX)
    if (ox.overflow) return false

    // 再判断是否Y越界
    let oy = this.checkOverflowY(offsetY)
    if (oy.overflow) return false

    // 最后判断碰撞情况
    let overlap = this.shape.grids.some(grid => {
      let x = grid.x + this.x + offsetX
      let y = grid.y + this.y + offsetY

      return baseBlock.atAbsolutePos(x, y)
    })
    if (overlap) return false

    this.x += offsetX
    this.y += offsetY
    return true // moved
  }

  rotate(baseBlock) {
    if (!this.canTransform) return false
    if (!this.shape.rotate) return false // shape不支持rotate方法
    if (!this.shape.grids) return false  // shape不支持grids变量

    this.shape.rotate()

    // 再判断是否Y越界，Y越界不允许变换
    let oy = this.checkOverflowY()
    if (oy.overflow && oy.dy < 0) {
      this.shape.rotate(-1)
      return false
    }
    
    // 先判断是否X越界
    let ox = this.checkOverflowX()
    this.x += ox.dx
    
    // 在判断是否重叠
    let overlap = this.shape.grids.some(grid => {
      let x = grid.x + this.x
      let y = grid.y + this.y

      return baseBlock.atAbsolutePos(x, y)
    })
    if (overlap) {
      this.shape.rotate(-1)
      this.x -= ox.dx
      return false
    }
    return true // rotated
  }

  //
  forEachGrid(fn) {
    this.shape.grids.forEach(grid => {
      fn(this.x+grid.x, this.y+grid.y, grid)
    })
  }

  // 使用画布绝对坐标定位
  atAbsolutePos(absX, absY) {
    let x = absX - this.x
    let y = absY - this.y

    let grids = this.shape.grids
    if (grids[y]) return grids[y][x]
    return null
  }

  // 相对定位
  at(x, y) {
    let grids = this.shape.grids
    if (grids[y]) return grids[y][x]
    return null
  }

  // 如果溢出了，返回溢出修正量
  checkOverflowX(offsetX=0) {
    let ret = { dx: 0, overflow: false }

    let leftGap = this.shape.boundLeft + this.x + offsetX
    let rightGap = (this.xRange[1] - 1) - (this.x + this.shape.boundRight + offsetX)

    if (leftGap < 0) {
      ret.dx = -leftGap
      ret.overflow = true
    } else if (rightGap < 0) {
      ret.dx = rightGap
      ret.overflow = true
    }

    return ret
  }
  checkOverflowY(offsetY=0) {
    let ret = { dy: 0, overflow: false }

    let topGap = this.shape.boundTop + this.y + offsetY
    let BottomGap = (this.yRange[1] - 1) - (this.y + this.shape.boundBottom + offsetY)

    if (topGap < 0) {
      ret.dy = -topGap
      ret.overflow = true
    } else if (BottomGap < 0) {
      ret.dy = BottomGap
      ret.overflow = true
    }

    return ret
  }

}

module.exports.Block = Block