const warning = 'JS-son: Created belief with non-JSON object, non-JSON data type value'

/**
 * JS-son agent belief generator
 * @param {string} id the belief's unique identifier
 * @param {any} value
 * @returns {object} JS-son agent belief
 */
const Belief = (id, value) => {
  const belief = {}
  belief[id] = value
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
