const warning = 'JS-son: desire body should be a function'

/**
 * JS-son agent desire generator
 *
 * @param {string} id the desire's unique identifier
 * @param {function} body a function for computing the desires value based on current beliefs
 * @returns {object} JS-son agent desire
 */
const Desire = (id, body) => {
  if (typeof (body) !== 'function') console.warn(warning)
  const desire = {}
  desire[id] = body
  return desire
}

module.exports = Desire
