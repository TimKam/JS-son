/**
 * JS-son plan generator
 * @param {function } head Determines if plan is active; can be a function or a JS-son goal
 * @param {function} body Determines what actions to execute
 * @returns {object} JS-plan
 */

const Plan = (head, body) => ({
  head,
  body,
  // run: executed body if head is true; else: return null
  run: function (beliefs) {
    return typeof head === 'function' ? head(beliefs) === true ? body.apply(this, [beliefs]) : null
      : head.isActive ? body.apply(this, [beliefs, head.value]) : null
  }
})

module.exports = Plan
