/**
 * JS-son agent intentions generator
 * @param {object} beliefs the agent's current beliefs
 * @param {object} desires the agent's desires (from which the intentions are filtered)
 * @param {function} preferenceFunctionGen
 * @returns {array} JS-son agent intentions
 */
const Intentions = (beliefs, desires, preferenceFunctionGen) => {
  const intentions = {}
  const intentionKeys = Object.keys(desires).filter(preferenceFunctionGen(beliefs, desires))
  intentionKeys.forEach(intentionKey => (intentions[intentionKey] = desires[intentionKey](beliefs)))
  return intentions
}

module.exports = Intentions
