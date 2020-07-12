/**
 * JS-son plan generator
 * @param {function } head Determines if plan is active
 * @param {function} body Determines what actions to execute
 * @returns {object} JS-plan
 */

const Plan = (head, body) => ({
  head,
  body,
  // run: executed body if head is true; else: return null
  run: function (beliefs) {
    return head(beliefs) === true ? body.apply(this, [beliefs]) : null
  }
})

module.exports = Plan
