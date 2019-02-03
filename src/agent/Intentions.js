/**
 * JS-son agent intentions generator
 * @param {object} beliefs the agent's current beliefs
 * @param {object} desires the agent's desires (from which the intentions are filtered)
 * @param {function} preferenceFunction
 * @returns {array} JS-son agent intentions
 */
const Intentions = (beliefs, desires, preferenceFunction) => {
    const intentions = {}
    const intentionKeys = Object.keys(desires).filter(preferenceFunction)
    intentionKeys.forEach(intentionKey => intentions[intentionKey] = desires[intentionKey](beliefs))
    return intentions
}

module.exports = Intentions
