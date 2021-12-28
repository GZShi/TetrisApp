class Event {
  constructor() {
    this.evMap = {}
  }

  listen(evName, callback) {
    let callbacks = this.evMap[evName] || []
    callbacks.push(callback)
    this.evMap[evName] = callbacks
  }

  emit(evName, payload) {
    let callbacks = this.evMap[evName]
    if (!callbacks) return

    callbacks.forEach(cb => {
      cb(payload)
    })
  }
}

module.exports.Event = Event