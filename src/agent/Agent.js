const Intentions = require('./Intentions')

const defaultPreferenceFunction = (beliefs, desires) => desireKey => desires[desireKey](beliefs)
const defaultBeliefRevisionFunction = (oldBeliefs, newBeliefs) => ({ ...oldBeliefs, ...newBeliefs })
const defaultGoalRevisionFunction = (beliefs, goals) => goals

/**
 * JS-son agent generation function. Note that an agent can be instantiated using either a
 * configuration object or a series of parameters
 * @param {object} config agent configuration object
 * @param {string} config.id unique identifier for the agent
 * @param {object} config.beliefs initial beliefs of the agent
 * @param {object} config.desires the agent's desires; default: empty array (no desire deliberation)
 * @param {array} config.plans the agent's plans
 * @param {function} config.determinePreferences preference function generator; by default
                                                 (if no function is provided), the preference
                                                 function turns all desires into intentions
 * @param {boolean} config.selfUpdatesPossible If true, agents can update their own belief, plans
                                               et cetera
                                               via a body of their plans. Defaults to ``true``.
 * @param {function} config.reviseBeliefs belief revision function that takes the agent's currently
                                          held beliefs as well as the "new" beliefs obtained from
                                          the environment and revises the agent's beliefs based on
                                          this. Defaults to: ``(oldBeliefs, newBeliefs) =>``
                                          ``({ ...oldBeliefs, ...newBeliefs })``
 * @param {function} config.reviseGoals goal revision function that takes the agent's beliefs
                                          and goals and then updates the goals.
                                          Defaults to: ``(beliefs, goals) => goals``
 * OR
 * @param {string} id unique identifier for the agent
 * @param {object} beliefs initial beliefs of the agent
 * @param {array} desires the agent's desires
 * @param {array} plans the agent's plans
 * @param {function} determinePreferences preference function generator; by default
                                          (if no function is provided), the preference function
                                          turns all desires into intentions
 * @param {boolean} selfUpdatesPossible If true, agents can update their own belief, plans et cetera
                                        via a body of their plans. Defaults to ``true``.
 * @param {function} reviseBeliefs belief revision function that takes the agent's currently held
                                   beliefs as well as the "new" beliefs obtained from the
                                   environment and revises the agent's beliefs based on this.
                                   Defaults to: ``(oldBeliefs, newBeliefs) =>``
                                   ``({ ...oldBeliefs, ...newBeliefs })``
* @param {function} reviseGoals goal revision function that takes the agent's beliefs
                                and goals and then updates the goals.
                                Defaults to: ``(beliefs, goals) => goals``
 * @returns {object} JS-son agent object
 */

function Agent (
  idConfig,
  beliefs,
  desires,
  plans,
  determinePreferences = defaultPreferenceFunction,
  selfUpdatesPossible = true,
  reviseBeliefs = defaultBeliefRevisionFunction,
  goals = undefined,
  reviseGoals = defaultGoalRevisionFunction
) {
  if (typeof idConfig === 'object') {
    const config = idConfig
    this.id = config.id
    this.beliefs = config.beliefs
    this.desires = config.desires || []
    this.plans = config.plans
    this.preferenceFunction = config.determinePreferences || defaultPreferenceFunction
    this.selfUpdatesPossible = !(config.selfUpdatesPossible === false)
    this.reviseBeliefs = config.reviseBeliefs || defaultBeliefRevisionFunction
    this.reviseGoals = config.reviseGoals || defaultGoalRevisionFunction
    this.goals = config.goals
  } else {
    this.id = idConfig
    this.beliefs = beliefs
    this.desires = desires
    this.plans = plans
    this.preferenceFunction = determinePreferences
    this.selfUpdatesPossible = selfUpdatesPossible
    this.reviseBeliefs = reviseBeliefs
    this.reviseGoals = reviseGoals
    this.goals = goals
  }
  this.isActive = true
  this.next = function (beliefs) {
    this.beliefs = this.reviseBeliefs(this.beliefs, beliefs)
    this.goals = this.reviseGoals(this.beliefs, this.goals)
    if (this.isActive) {
      if (Object.keys(this.desires).length === 0) {
        this.intentions = this.beliefs
      } else {
        this.intentions = Intentions(this.beliefs, this.desires, this.preferenceFunction)
      }
      return this.plans.map(
        plan => this.selfUpdatesPossible
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
