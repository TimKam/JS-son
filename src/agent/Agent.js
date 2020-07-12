const Intentions = require('./Intentions')

/**
 * JS-son agent generation function
 * @param {string} id unique identifier for the agent
 * @param {object} beliefs initial beliefs of the agent
 * @param {object} desires the agent's desires
 * @param {array} plans the agent's plans
 * @param {function} determinePreferences preference function generator; by default
                                          (if no function is provided), the preference function
                                          turns all desires into intentions
 * @param {boolean} selfUpdatesPossible If true, agents can update their own belief, plans et cetera
                                        via the body of their plans. Defaults to ``true``.
 * @returns {object} JS-son agent object
 */

function Agent (
  id,
  beliefs,
  desires,
  plans,
  determinePreferences = (beliefs, desires) => desireKey => desires[desireKey](beliefs),
  selfUpdatesPossible = true
) {
  this.id = id
  this.beliefs = beliefs
  this.desires = desires
  this.plans = plans
  this.preferenceFunction = determinePreferences
  this.selfUpdatesPossible = selfUpdatesPossible
  this.isActive = true
  this.next = function (beliefs) {
    this.beliefs = {
      ...this.beliefs,
      ...beliefs
    }
    if (this.isActive) {
      if (Object.keys(desires).length === 0) {
        this.intentions = this.beliefs
      } else {
        this.intentions = Intentions(this.beliefs, this.desires, this.preferenceFunction)
      }
      return this.plans.map(
        plan => selfUpdatesPossible
          ? plan.run.apply(this, [this.intentions])
          : plan.run(this.intentions)
      ).filter(
        result => result !== null
      )
    }
  }
  this.stop = () => (this.isActive = false)
  this.start = () => (this.isActive = true)
}

module.exports = Agent
