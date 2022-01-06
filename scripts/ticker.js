class Ticker {
  constructor() {
    this.count = 0
    this.stepCount = 10
    this.handler = -1
    this.turbo = false
  }

  run(cb, interval=100) {
    if (this.handler != -1) return
    this.handler = setInterval(() => {
      this.count++
      if (!cb || typeof cb !== 'function') return
      if (this.turbo == false && this.count % this.stepCount != 0) return
      
      cb()
    }, interval)
  }

  stop() {
    clearInterval(this.handler)
    this.handler = -1
  }
  reset() {
    this.stop()
    this.count = 0
    this.stepCount = 10
  }
  turboOn() { this.turbo = true }
  turboOff() { this.turbo = false }
  speedUp() {
    this.stepCount -= 1
    if (this.stepCount <= 0) {
      this.stepCount = 1
    }
  }
}

module.exports.Ticker = Ticker