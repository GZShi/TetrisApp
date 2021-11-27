const types = 'ILJSZOT'.split('')
const left = 0
const top = 1
const right = 2
const bottom = 3
const shapes = {
  'I': [
    parseShape('01,11,31,21'),
    parseShape('21,20,22,23')
  ],
  'L': [
    parseShape('11,10,22,12'),
    parseShape('11,21,31,12'),
    parseShape('11,21,22,23'),
    parseShape('02,21,22,12')
  ],
  'J': [
    parseShape('12,20,21,22'),
    parseShape('12,11,32,22'),
    parseShape('12,11,21,13'),
    parseShape('01,11,21,22'),
  ],
  'S': [
    parseShape('11,10,21,22'),
    parseShape('12,21,31,22'),
  ],
  'Z': [
    parseShape('11,20,21,12'),
    parseShape('11,21,32,22'),
  ],
  'O': [
    parseShape('11,21,22,12')
  ],
  'T': [
    parseShape('11,20,31,21'),
    parseShape('21,20,31,22'),
    parseShape('11,21,31,22'),
    parseShape('11,20,21,22'),
  ]
}

exports.getShape = function (type, rotate=0) {
  return new Shape(type, rotate)
}
exports.getRandShape = function () {
  return new Shape(randArr(types), randN(4))
}

class Shape {
  constructor(type, rotate=0) {
    this.type = type
    this.r = rotate
    this.shape = getShapes()[this.type]
  }

  // actions
  rotate(nums=1) {
    this.r += nums
  }


  get grids() {
    return this.shape[this.r % this.shape.length]
  }
  get boundLeft() { return this.grids[left].x }
  get boundRight() { return this.grids[right].x }
  get boundTop() { return this.grids[top].y }
  get boundBottom() { return this.grids[bottom].y }
}

//
// some help functions
//

// str: left.xy,top.xy,right.xy,bottom.xy
function parseShape(str) {
  return str.split(',').map(xy => {
    let [x, y] = xy.split('')
    return {x: +x, y: +y}
  })
}
function getShapes() {
  return shapes
}
function randArr(arr) {
  return arr[randN(arr.length)]
}
function randN(n) {
  return (Math.random()*n)>>0
}