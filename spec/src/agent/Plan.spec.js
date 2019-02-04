const Belief = require('../../../src/agent/Belief')
const Desire = require('../../../src/agent/Desire')
const Intentions = require('../../../src/agent/Intentions')
const Plan = require('../../../src/agent/Plan')

describe('Plan / run()', () => {
  const beliefs = { ...Belief('dogNice', true), ...Belief('dogHungry', true) }
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

  const praiseDog = Plan(intentions => intentions.praiseDog, () => ({
    actions: ['Good dog!']
  }))

  it('should return ``null`` if head does not resolve to ``true``', () => {
    beliefs.dogHungry = true
    const intentions = Intentions(beliefs, desires, preferenceFunctionGen)
    expect(praiseDog.run(intentions)).toBe(null)
  })

  it('should return the result of its body if head resolves to ``true``', () => {
    beliefs.dogHungry = false
    const intentions = Intentions(beliefs, desires, preferenceFunctionGen)
    const expectedPlanResult = {
      actions: ['Good dog!']
    }
    expect(praiseDog.run(intentions)).toEqual(expectedPlanResult)
  })
})
