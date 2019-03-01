const Agent = require('../../../src/agent/Agent')
const Environment = require('../../../src/environment/Environment')

const {
  beliefs,
  desires,
  preferenceFunctionGen,
  plans
} = require('../../mocks/human')

const {
  dogBeliefs,
  dogDesires,
  dogPreferenceFunctionGen,
  dogPlans
} = require('../../mocks/dog')

console.log = jasmine.createSpy('log')

describe('Environment / run()', () => {
  const human = new Agent('human', beliefs, desires, plans, preferenceFunctionGen)

  const state = {
    dogNice: true,
    dogHungry: true
  }

  const update = actions => {
    return actions.some(action => action.actions.includes('Here, take some food!'))
      ? { dogHungry: false } : {}
  }

  it('Should process agent actions', () => {
    const environment = new Environment([human], state, update)
    environment.run(1)
    expect(console.log).toHaveBeenCalledWith({ dogNice: true, dogHungry: false })
  })

  it('Should allow agent-to-agent interaction', () => {
    const dog = new Agent('dog', dogBeliefs, dogDesires, dogPlans, dogPreferenceFunctionGen)
    // console.log(dog)
    // const dog = createAgent('dog')
    const updateMAS = actions => {
      const stateUpdate = {}
      actions.forEach(action => {
        if (action.actions.includes('Here, take some food!')) stateUpdate.foodAvailable = true
        if (action.actions.includes('Good dog!')) stateUpdate.dogRecentlyPraised = true
        else stateUpdate.dogRecentlyPraised = false
        if (action.actions.includes('Eat')) {
          stateUpdate.foodAvailable = false
          stateUpdate.dogHungry = false
        }
      })
      return stateUpdate
    }
    const environment = new Environment(
      [human, dog], {
        ...state,
        ...{
          foodAvailable: false,
          dogRecentlyPraised: false
        }
      },
      updateMAS
    )
    const history = environment.run(1)
    const expectedHistory = [{
      dogNice: true,
      dogHungry: true,
      foodAvailable: false,
      dogRecentlyPraised: false
    }, {
      dogNice: true,
      dogHungry: false,
      foodAvailable: false,
      dogRecentlyPraised: false
    }]
    expect(JSON.stringify(history)).toEqual(JSON.stringify(expectedHistory))
  })

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
