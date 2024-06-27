const Belief = require('./Belief')

const warning = 'JS-son: functional belief without proper two-argument function'

/**
 * JS-son agent belief generator
 * @param {string} id the belief's unique identifier
 * @param {any} value the belief's default value
 * @param {function} rule the function that is used to infer the belief, given the agent's current beliefs and the belief update
 * @param {number} order the belief's order when belief functions are evaluated
 * @param {number} priority the belief's priority in case of belief revision; optional
 * @param {boolean} updatePriority whether in case of a belief update, the priority of the defeating belief should be adopted; optional, defaults to true
 * @returns {object} JS-son agent functional belief
 */
const FunctionalBelief = (id, value, rule, order, priority, updatePriority=false) => {
  if (typeof rule !== 'function' || rule.length !== 2) console.warn(warning)
  const baseBelief = Belief(id, value, priority, updatePriority=false)
  return { ...baseBelief, rule, order, value }
}

module.exports = FunctionalBelief