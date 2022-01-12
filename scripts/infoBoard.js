
class InfoBoard {
  constructor() {
    this.score = 0
    this.combo = 0
    this.lines = 0
    this.level = 1
    this.levelUpTarget = 10
  }

  cleanLines(n=0) {
    if (n <= 0) {
      return {
        score: this.score,
        combo: this.combo,
        lines: this.lines,
        level: this.level
      }
    }

    if (n >= 4) {
      this.combo++
    } else {
      this.combo = 0
    }
    this.lines += n
    if (this.lines >= this.levelUpTarget) {
      this.level++
      this.levelUpTarget *= 1.3
    }
    this.score += (1 << (n-1)) * (1<<Math.min(this.combo, 5))
    
    return {
      score: this.score,
      combo: this.combo,
      lines: this.lines,
      level: this.level
    }
  }
}

module.exports.InfoBoard = InfoBoard