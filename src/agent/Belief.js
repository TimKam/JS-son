const warning = 'JS-son: Created belief with non-JSON object, non-JSON data type value'

/**
 * JS-son agent belief generator
 * @param {string} id the belief's unique identifier
 * @param {any} value the belief's value
 * @param {number} priority the belief's priority in case of belief revision; optional
 * @param {boolean} updatePriority whether in case of a belief update, the priority of the defeating belief should be adopted; optional, defaults to true
 * @returns {object} JS-son agent belief
 */
const Belief = (id, value, priority, updatePriority=false) => {
  const belief = {}
  belief[id] = value
  if (priority || priority === 0) {
    belief.priority = priority
    belief['value'] = value
    belief.updatePriority = updatePriority
  }
  try {
    const parsedBelief = JSON.parse(JSON.stringify(belief))
    if (Object.keys(parsedBelief).length !== Object.keys(belief).length) {
      console.warn(warning)
    }
  } catch (error) {
    console.warn(warning)
  }
  return belief
}

module.exports = Belief
