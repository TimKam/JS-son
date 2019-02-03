Intentions = require('./Intentions')

/**
 * JS-son agent generation function
 * @param {object} beliefs initial beliefs
 * @param {object} desires desires
 * @param {object} plans plans
 * @param {function} determinePreferences preference function
 * @returns {object} JS-son agent object
 */

function Agent (beliefs, desires, plans, determinePreferences) {
    this.beliefs = beliefs
    this.desires = desires
    this.plans = plans
    this.preferenceFunction = determinePreferences
    this.isActive = true
    this.next = function() {
        if(this.isActive) {
            this.intentions = Intentions(this.beliefs, this.desires, this.preferenceFunction)
            return this.plans.map(
                plan => plan.run(this.intentions)
            ).filter(
                    result => result !== null
                )  
        }
    }
    this.stop = () => this.isActive = false
    this.start = () => this.isActive = true
}

module.exports = Agent
