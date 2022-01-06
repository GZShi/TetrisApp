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
    if (!callbacks) {
      console.log(`event: '${evName}' (nil callback)`, payload)
      return
    }

    console.log(`event: '${evName}'`, payload)
    callbacks.forEach(cb => {
      cb(payload)
    })
  }
}

module.exports.Event = Event