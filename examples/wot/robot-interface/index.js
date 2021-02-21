const fetch = require('node-fetch')

var url = global.url

const defaultDelay = 3000

let apiToken

/**
 * Dummy error handling function: throws error it receives as its input
 * @param {error} error The error that is to be thrown
 */
function onError (error) {
  throw error
}

/**
 * Dummy success handling function: does nothing
 */
function onSuccess () {}

/**
 * Waits (async.) for the specified delay and then makes a put request with the specified body
 * against the specified endpoint
 * @param {string} endpoint Request endpoint
 * @param {object} body Request body
 * @param {number} delay Delay in milliseconds
 * @returns {Promise} Request result promise
 */
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

/**
 * Registers a user at a Leubot interface at the specified URL
 * @param {string} robotUrl URL of the Leubot interface
 * @param {object} user ``{ user, email}`` object
 * @param {*} successCallback Callback function in case of success
 * @param {*} errorCallback Callback function in case of error
 * @returns {Promise} Request result promise
 */
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

/**
 * Sets the robot's elbow angle
 * @param {number} angleValue Value in [400,650]
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise
 */
function setElbowAngle (angleValue, delay = defaultDelay) {
  return delayPut('elbow', { value: angleValue }, delay)
}

/**
 * Sets the robot's wrist angle
 * @param {number} angleValue Value in [200,830]
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise
 */
function setWristAngle (angleValue, delay = defaultDelay) {
  return delayPut('wrist/angle', { value: angleValue }, delay)
}

/**
 * Sets the robot's wrist rotation
 * @param {number} rotationValue Value in [0,1023]
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise
 */
function setWristRotation (rotationValue, delay = defaultDelay) {
  return delayPut('wrist/rotation', { value: rotationValue }, delay)
}

/**
 * Sets the robot's gripper (opens or closes is to the specified "degree")
 * @param {number} gripperValue Value in [0,512]
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise
 */
function setGripper (gripperValue, delay = defaultDelay) {
  return delayPut('wrist/gripper', { value: gripperValue }, delay)
}

/**
 * Sets the robot's base orientation
 * @param {number} baseValue Value in [0,???]
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise
 */
function setBase (baseValue, delay = defaultDelay) {
  return delayPut('wrist/base', { value: baseValue }, delay)
}

/**
 * Resets the robot
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions) 
 * @returns {Promise} Request result promise
 */
function reset (delay = defaultDelay) {
  return delayPut('reset', undefined, delay)
}

/**
 * Instructs the robot to assemble product configuration A with the specified speed (delay)
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise of the final request
 */
function assembleConfigurationA (delay) {
  return setElbowAngle(550, delay)
    .then(setWristAngle(450, delay)
      .then(setWristRotation(500, delay)
        .then(reset(delay))))
}

/**
 * Instructs the robot to assemble product configuration B with the specified speed (delay)
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise of the final request
 */
function assembleConfigurationB (delay) {
  return setGripper(512, delay).then(setWristAngle(550, delay)
    .then(setBase(500)
      .then(setWristRotation(390, delay)
        .then(setElbowAngle(510, delay)
          .then(setGripper(400, delay)
            .then(setElbowAngle(400, delay)
              .then(setBase(100)
                .then(reset(delay)))))))))
}

/**
 * Instructs the robot to assemble product configuration C with the specified speed (delay)
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise of the final request
 */
function assembleConfigurationC (delay) {
  return setWristRotation(750, delay)
    .then(setElbowAngle(450, delay)
      .then(setWristAngle(500, delay)
        .then(reset(delay))))
}

/**
 * Instructs the robot to assemble the specified product configuration with the specified speed (delay)
 * @param {string} configuration Product configuration that is to assembled
 * @param {number} delay Delay in milliseconds (to not overwhelm the robot with control instructions)
 * @returns {Promise} Request result promise of the final request
 */
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
  setGripper,
  setBase,
  reset,
  assembleConfigurationA,
  assembleConfigurationB,
  assembleConfigurationC,
  assemble
}
