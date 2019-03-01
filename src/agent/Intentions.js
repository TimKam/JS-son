/**
 * JS-son agent intentions generator
 * @param {object} beliefs the agent's current beliefs
 * @param {object} desires the agent's desires (from which the intentions are filtered)
 * @param {function} preferenceFunctionGenerator
 * @returns {array} JS-son agent intentions
 */
const Intentions = (beliefs, desires, preferenceFunctionGenerator) => {
  const intentions = {}
  const intentionKeys = Object.keys(desires).filter(preferenceFunctionGenerator(beliefs, desires))
  intentionKeys.forEach(intentionKey => (intentions[intentionKey] = desires[intentionKey](beliefs)))
  return intentions
}

module.exports = Intentions
