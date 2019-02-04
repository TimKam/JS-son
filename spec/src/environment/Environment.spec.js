const Belief = require('../../../src/agent/Belief')
const Desire = require('../../../src/agent/Desire')
const Plan = require('../../../src/agent/Plan')
const Agent = require('../../../src/agent/Agent')
const Environment = require('../../../src/environment/Environment')

console.log = jasmine.createSpy('log')

describe('Environment / run()', () => {
  const createAgent = (type) => {
    const beliefs = {
      ...Belief('dogNice', true),
      ...Belief('dogHungry', false)
    }
    if (type === 'human') {
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
      return new Agent('human', beliefs, desires, plans, preferenceFunctionGen)
    } else {
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
      return new Agent('human', beliefs, desires, plans, preferenceFunctionGen)
    }
  }

  const human = createAgent('human')

  const state = {
    dogNice: true,
    dogHungry: true
  }

  const update = actions => {
    return actions.some(action => action.actions.includes('Here, take some food!')) ? { dogHungry: false } : {}
  }

  it('Should process agent actions', () => {
    const environment = new Environment([human], state, update)
    environment.run(1)
    expect(console.log).toHaveBeenCalledWith({ dogNice: true, dogHungry: false })
  })

  /*it('Should allow agent-to-agent interaction', () => {
    expect(true).toBe(true)
  })*/

  it('Should terminate after the specified number of iterations', () => {
    const environment = new Environment([human], state, update)
    const history = environment.run(2)
    const expectedHistory = [
      { dogNice: true, dogHungry: true },
      { dogNice: true, dogHungry: false },
      { dogNice: true, dogHungry: false }
    ]
    expect(history).toEqual(expectedHistory)
  })
})
