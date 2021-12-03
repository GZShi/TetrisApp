let instance = null
exports.getControl = () => {
  if (!instance) {
    instance = new Control()
  }
  return instance
}

class Control {
  constructor() {
    this.game = null
    this.disableInput = true
    this.tickInterval = 100 // ms
    this.ticker = null
  }
  bindGame(game) {
    this.game = game
  }

  pause() {
    clearInterval(this.ticker)
    this.ticker = null
    this.disableInput = true
  }
  start() {
    if (this.ticker) {
      return
    }
    this.ticker = setInterval(() => {
      this.game.runTick()
    }, this.tickInterval)

    this.disableInput = false
  }
  autoPlay(...cmds) {
    if (!cmds || cmds.length == 0) {
      return
    }
    let index = 0
    setInterval(() => {
      let cmd = cmds[index]
      index++
      if (index == cmds.length) {
        index = 0
      }
      this.tap(cmd)
    }, 200)
  }

  tap(cmd) {
    if (this.disableInput) {
      if (cmd != 'start') {
        if (cmd.indexOf('debug:') < 0) {
          return
        }
      }
    }

    switch(cmd) {
    case 'left': this.game.moveCurrX(-1); break
    case 'right': this.game.moveCurrX(1); break
    case 'top': this.game.dropCurr(); break
    case 'bottom:began': this.game.setTurbo(true); break
    case 'bottom:end': this.game.setTurbo(false); break
    case 'rotate': this.game.rotateCurr(); break
    case 'drop': this.game.dropCurr(); break
    case 'start': this.start(); break
    case 'pause': this.pause(); break
    case 'debug:step': this.game.runTick(); break
    case 'debug:up': this.game.moveCurrY(-1); break
    case 'debug:down': this.game.moveCurrY(1); break
    }
  }
}