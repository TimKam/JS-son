const Belief = require('../../../src/agent/Belief')
const Desire = require('../../../src/agent/Desire')
const Plan = require('../../../src/agent/Plan')
const Agent = require('../../../src/agent/Agent')

describe('Agent / next()', () => {
  const beliefs = {
    ...Belief('dogNice', true),
    ...Belief('dogHungry', false)
  }

  const desires = {
    ...Desire('praiseDog', beliefs => beliefs.dogNice),
    ...Desire('feedDog', beliefs => beliefs.dogNice && beliefs.dogHungry)
  }

  const preferenceFunction = desireKey => {
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

  const agent = new Agent('myAgent', beliefs, desires, plans, preferenceFunction)

  it('should not return inactive plans', () => {
    agent.start()
    expect(agent.next().length).toEqual(1)
  })

  it('should return plan execution result for active plans', () => {
    agent.start()
    expect(agent.next()[0]).toEqual({
      actions: ['Good dog!']
    })
  })

  it('should return nothing if agent is inactive', () => {
    agent.stop()
    expect(agent.next()).toEqual(undefined)
  })
})
