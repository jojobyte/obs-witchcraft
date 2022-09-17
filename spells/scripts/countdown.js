
const initalFontSize = 18
const maxFontSize = 36
const second = 1000

if (!localStorage.getItem('countdown')) {
  localStorage.setItem('countdown', 5 * 60 * second)
}
if (!localStorage.getItem('autostart')) {
  localStorage.setItem('autostart', false)
}
if (!localStorage.getItem('autorecord')) {
  localStorage.setItem('autorecord', false)
}
if (!localStorage.getItem('autoreset')) {
  localStorage.setItem('autoreset', false)
}

let countdownInterval, switchToScene
let countdownRunning = false
let obsRecording = false

let bc = new BroadcastChannel('countdown')
let storeCountdown = parseInt(localStorage.getItem('countdown'), 10)
let checkboxes = {
  start: JSON.parse(localStorage.getItem('autostart')),
  record: JSON.parse(localStorage.getItem('autorecord')),
  reset: JSON.parse(localStorage.getItem('autoreset')),
}

let countdownElement = document.querySelector('h1')
let inputElement = document.querySelector('#controls input')
let inputValueElement = document.querySelector('#controls span')
let buttonElements = document.querySelector('#controls')
let toggleButtonElement = document.querySelector('#controls button[name=toggle]')
let scenesSelectorElement = document.querySelector('#scenesSelector')
let checkboxAutoStartElement = document.querySelector('#controls input[name=auto_start]')
let checkboxAutoRecordElement = document.querySelector('#controls input[name=auto_record]')
let checkboxAutoResetElement = document.querySelector('#controls input[name=auto_reset]')

// switchToScene = scenesSelectorElement?.value
checkboxAutoStartElement.checked = checkboxes.start
checkboxAutoRecordElement.checked = checkboxes.record
checkboxAutoResetElement.checked = checkboxes.reset

window.obsstudio = window.obsstudio || (function(){
  return {
    setCurrentScene: (e) => console.log('obsstudio.setCurrentScene', e),
    startRecording: (e) => console.log('obsstudio.startRecording', e),
    getScenes: (e) => console.log('obsstudio.getScenes', e),
    getStatus: (e) => console.log('obsstudio.getStatus', e),
  }
})()

function updateCountdown() {
  storeCountdown -= second;

  if (storeCountdown < 0) {
    storeCountdown = 0;
    countdownRunning = false

    if (switchToScene) {
      window.obsstudio.setCurrentScene(switchToScene)
    }
    if (!obsRecording && checkboxes.record) {
      window.obsstudio.startRecording()
    }
    if (checkboxes.reset) {
      resetButton()
    }
  }

  if (!countdownRunning) {
    return clearInterval(countdownInterval)
  }

  countdownElement.textContent = getCountdownText(storeCountdown)

  if (storeCountdown < 10 * second) {
    countdownElement.style.fontSize = `${
      ((maxFontSize-initalFontSize)/(storeCountdown/second))+initalFontSize
    }vw`
  }

  if (storeCountdown === 0) {
    updateButton(toggleButtonElement)
  }
}

function getCountdownText (time) {
  let countdownSeconds = time / second
  let countdownMinutesStr = `${Math.floor(countdownSeconds / 60)}`.padStart(2, '0')
  let countdownSecondsStr = `${Math.ceil(countdownSeconds % 60)}`.padStart(2, '0')

  return `${countdownMinutesStr}:${countdownSecondsStr}`
}

function updateInput (time) {
  inputElement.value = time
  inputValueElement.textContent = getCountdownText(time)
}

function updateButton (target) {
  if (countdownRunning) {
    target.classList.add('pause')
    return target.textContent = 'Pause'
  }

  target.classList.remove('pause')
  target.textContent = 'Start'
}

function toggleButton () {
  if (countdownRunning) {
    countdownRunning = false
    return clearInterval(countdownInterval)
  }

  countdownRunning = true
  countdownInterval = setInterval(updateCountdown, second)
}

function resetButton () {
  clearInterval(countdownInterval)
  storeCountdown = parseInt(localStorage.getItem('countdown'), 10)
  countdownRunning = false
  countdownElement.textContent = getCountdownText(storeCountdown)
  countdownElement.style.fontSize = `${initalFontSize}vw`
  updateButton(toggleButtonElement)
}

updateInput(storeCountdown)

inputElement.addEventListener('change', event => {
  localStorage.setItem('countdown', event.target.value)
  inputValueElement.textContent = getCountdownText(event.target.value)
  countdownElement.textContent = getCountdownText(storeCountdown)
  updateButton(toggleButtonElement)
})

inputElement.addEventListener('input', event => {
  inputValueElement.textContent = getCountdownText(event.target.value)
})

buttonElements.addEventListener('click', event => {
  if (event?.target?.name) {
    let [ name, sec ] = event.target.name.split('_')
    console.log(name, sec)

    if (name === 'toggle') {
      toggleButton()
      updateButton(event.target)
      bc.postMessage(['toggle', countdownRunning])
    }
    if (name === 'reset') {
      resetButton()
      bc.postMessage(['reset'])
    }
    if (name === 'sub') {
      storeCountdown -= second * sec
      bc.postMessage([name, sec])
    }
    if (name === 'add') {
      storeCountdown += second * sec
      bc.postMessage([name, sec])
    }
    if (name === 'auto') {
      console.log(`auto${sec} target`, event?.target?.checked)
      checkboxes[sec] = event?.target?.checked
      localStorage.setItem(`auto${sec}`, checkboxes[sec])
      bc.postMessage([name, checkboxes[sec]])
    }
  }
})

scenesSelectorElement.addEventListener('change', event => {
  console.log('scene selector change', event?.target?.value)
  bc.postMessage(['countdownScene', event?.target?.value])
  switchToScene = event?.target?.value
})

// console.log('window.obsstudio', window.obsstudio)

// window.obsstudio.getControlLevel(function (level) {
//   console.log(level)
// })

// window.addEventListener('obsSceneChanged', function(event) {
//   console.log('scene changed', event.detail.name)
// })

// window.obsstudio.getCurrentScene(function(scene) {
//   console.log(scene)
// })

window.addEventListener('obsStreamingStarted', event => {
  console.log('obsStreamingStarted', checkboxes.start, event)
  if (checkboxes.start) {
    toggleButton()
    updateButton(toggleButtonElement)
    bc.postMessage(['toggle', countdownRunning])
  }
})

window.addEventListener('obsRecordingStarted', event => {
  console.log('obsRecordingStarted', event)
  obsRecording = true
  bc.postMessage(['recording', obsRecording])
})

window.addEventListener('obsRecordingStopped', event => {
  console.log('obsRecordingStopped', event)
  obsRecording = false
  bc.postMessage(['recording', obsRecording])
})

window.obsstudio?.getScenes(function (scenes) {
  console.log('obsstudio.getScenes', scenes)

  bc.postMessage(['scenes', scenes])
})

window.obsstudio?.getStatus(function (status) {
	console.log('obsstudio.getStatus', status)
  bc.postMessage(['status', status])
  obsRecording = status.recording
})

bc.onmessage = (event) => {
  if (event.data[0] === 'autostart') {
    console.log('autostart browser dock', event.data[1])
    checkboxes.start = event.data[1]
    localStorage.setItem('autostart', event.data[1])
  }
  if (event.data[0] === 'countdownScene') {
    console.log('scene from browser dock', event.data[1])
    switchToScene = event.data[1]
  }
  if (event.data[0] === 'scenes' && event.data[1]) {
    console.log('scenes from browser source', event.data[1])

    let sceneStr = `<option value="">Don't Switch</option>`

    for (let scene of event.data[1]) {
      sceneStr += `<option>${scene}</option>`
    }

    scenesSelectorElement.innerHTML = sceneStr
  }
  if (event.data[0] === 'recording') {
    obsRecording = event.data[1]
  }
  if (event.data[0] === 'sub') {
    storeCountdown -= second * event.data[1]
  }
  if (event.data[0] === 'add') {
    storeCountdown += second * event.data[1]
  }
  if (event.data[0] === 'reset') {
    resetButton()
  }
  if (event.data[0] === 'toggle') {
    countdownRunning = event.data[1]

    if (event.data[1]) {
      countdownInterval = setInterval(updateCountdown, second)
    }
  }
}

countdownElement.textContent = getCountdownText(storeCountdown)

countdownInterval = setInterval(updateCountdown, second)