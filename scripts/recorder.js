class Recorder {
  constructor() {
    this.base = 0
    this.records = []
  }

  record(actionName, actionParams=[]) {
    if (this.records.length == 0) {
      this.base = Date.now()
    }
    this.records.push({
      t: Date.now() - this.base,
      a: actionName,
      p: actionParams,
    })
  }

  print() {
    console.log('the action records', JSON.stringify(this))
  }

  async play(game) {
    game.mode = 'replay'
    let ctrl = game.getController()

    for (let i = 0; i < this.records.length; i++) {
      let {t, a, p} = this.records[i]
      switch (a) {
      case 'stepover': game.stepover(); break
      default:
        if (ctrl[a]) {
          ctrl[a].apply(this, p)
        }
      }
      let next = this.records[i+1]
      if (next) {
        await sleep(next.t - t)
      }
    }
  }
}

async function sleep(tick) {
  return new Promise(resolve => {
    setTimeout(resolve, tick)
  })
}

module.exports.Recorder = Recorder