/**
 * JS-son remote agent generation function. The remote agent is an environment's interface
 * to a JS-son agent that runs in a different context, for example on a client that accesses a
 * server-side environment
 * @param {string} id unique identifier for the (remote) agent
 * @param {object} beliefs initial beliefs of the agent
 * @param {function} next function that implements and interface to the remote implementation
 * @returns {object} JS-son remote agent object
 */

function RemoteAgent (
  id,
  beliefs,
  next
) {
  this.id = id
  this.beliefs = beliefs
  this.isActive = true
  this.next = function (beliefs) {
    this.beliefs = {
      ...this.beliefs,
      ...beliefs
    }
    if (this.isActive) {
      return next(this.beliefs)
    }
  }
  this.stop = () => (this.isActive = false)
  this.start = () => (this.isActive = true)
}

module.exports = RemoteAgent
