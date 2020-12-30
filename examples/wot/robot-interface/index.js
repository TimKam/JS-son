const fetch = require('node-fetch')

var url = global.url

const defaultDelay = 3000

let apiToken

function onError (error) {
  throw error
}

function onSuccess () {}

function delayPut (endpoint, body, delay = defaultDelay) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(fetch(`${url}/${endpoint}`, {
        method: 'put',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiToken },
        body: JSON.stringify(body || {})
      }))
    }, delay)
  })
}

function start (robotUrl, user, successCallback = onSuccess, errorCallback = onError) {
  url = robotUrl
  return fetch(`${url}/user`, {
    method: 'post',
    body: JSON.stringify(user)
  }).then((response) => {
    try {
      apiToken = response.headers.raw().location[0].replace(`${url}/user/`, '')
      console.log(apiToken)
      successCallback()
    } catch (error) {
      errorCallback(error)
    }
  })
}

function setElbowAngle (angleValue, delay = defaultDelay) {
  return delayPut('elbow', { value: angleValue }, delay)
}

function setWristAngle (angleValue, delay = defaultDelay) {
  return delayPut('wrist/angle', { value: angleValue }, delay)
}

function setWristRotation (rotationValue, delay = defaultDelay) {
  return delayPut('wrist/rotation', { value: rotationValue }, delay)
}

function reset (delay = defaultDelay) {
  return delayPut('reset', undefined, delay)
}

function assembleConfigurationA (delay) {
  return setElbowAngle(550, delay)
    .then(setWristAngle(450, delay)
      .then(setWristRotation(500, delay)
        .then(reset(delay))))
}

function assembleConfigurationB (delay) {
  return setWristAngle(550, delay)
    .then(setElbowAngle(450, delay)
      .then(setWristRotation(750, delay)
        .then(reset(delay))))
}

function assembleConfigurationC (delay) {
  return setWristRotation(750, delay)
    .then(setElbowAngle(450, delay)
      .then(setWristAngle(500, delay)
        .then(reset(delay))))
}

function assemble (configuration, delay) {
  switch (configuration) {
    case 'A':
      return assembleConfigurationA(delay)
    case 'B':
      return assembleConfigurationB(delay)
    case 'C':
    default:
      return assembleConfigurationC(delay)
  }
}

module.exports = {
  start,
  setElbowAngle,
  setWristAngle,
  setWristRotation,
  reset,
  assembleConfigurationA,
  assembleConfigurationB,
  assembleConfigurationC,
  assemble
}
