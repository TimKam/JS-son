const Belief = require('../../src/agent/Belief')
const Desire = require('../../src/agent/Desire')
const Plan = require('../../src/agent/Plan')

const dogBeliefs = {
  ...Belief('dogNice', true),
  ...Belief('dogHungry', false),
  ...Belief('foodAvailable', false),
  ...Belief('dogRecentlyPraised', false)
}

const dogDesires = {
  ...Desire('wagTail', beliefs => beliefs.recentlyPraised),
  ...Desire('eat', beliefs => beliefs.foodAvailable && beliefs.dogHungry)
}
const dogPreferenceFunctionGen = (beliefs, desires) => desireKey => {
  if (!desires[desireKey](beliefs)) {
    return false
  } else if (desireKey === 'eat' || !desires['eat'](beliefs)) {
    return true
  } else {
    return false
  }
}
const dogPlans = [
  Plan(intentions => intentions.eat, () => ({
    actions: ['Eat']
  })),
  Plan(intentions => intentions.wagTail, () => ({
    actions: ['Wag tail']
  }))
]

module.exports = {
  dogBeliefs,
  dogDesires,
  dogPreferenceFunctionGen,
  dogPlans
}
