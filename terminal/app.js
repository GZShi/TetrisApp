let s = require('./actions.js')

s.initrender()
s.tapstart()

const keyArrowLeft  = '0x1b5b44'
const keyArrowUp    = '0x1b5b41'
const keyArrowRight = '0x1b5b43'
const keyArrowDown  = '0x1b5b42'
const keyCtrlC = '0x03'
const keyP = '0x70'
const keyS = '0x73'

let stdin = process.stdin
stdin.setRawMode(true)
stdin.resume()
stdin.on('data', function (key) {
    let str = '0x' + [...key].map(n => n.toString(16).padStart(2, '0')).join('')
    
    switch (str) {
    case keyArrowLeft: s.tapleft(); break
    case keyArrowUp: s.taprotate(); break
    case keyArrowRight: s.tapright(); break
    case keyArrowDown: s.tapdrop(); break
    case keyCtrlC: process.exit(0); break
    case keyP: s.tappause(); break
    case keyS: s.tapstart(); break
    default:
        console.log(`unknown key: ${str}`)
    }
})