const Belief = require('../../src/agent/Belief')
const Desire = require('../../src/agent/Desire')
const Plan = require('../../src/agent/Plan')

const beliefs = {
  ...Belief('dogNice', true),
  ...Belief('dogHungry', false)
}

const desires = {
  ...Desire('praiseDog', beliefs => beliefs.dogNice),
  ...Desire('feedDog', beliefs => beliefs.dogNice && beliefs.dogHungry)
}

const preferenceFunctionGen = (beliefs, desires) => desireKey => {
  if (!desires[desireKey](beliefs)) {
    return false
  } else if (desireKey === 'feedDog' || !desires['feedDog'](beliefs)) {
    return true
  } else {
    return false
  }
}

const plans = [
  Plan(intentions => intentions.praiseDog, () => ({
    actions: ['Good dog!']
  })),
  Plan(intentions => intentions.feedDog, () => ({
    actions: ['Here, take some food!']
  }))
]

module.exports = {
  beliefs,
  desires,
  preferenceFunctionGen,
  plans
}
