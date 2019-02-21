/* Integration test for simplified belief-plan approach */
const {
  Agent,
  Environment
} = require('../../src/js-son')

const {
  beliefs,
  desires,
  preferenceFunctionGen,
  plans
} = require('../mocks/human')

const {
  dogBeliefs,
  dogDesires,
  dogPreferenceFunctionGen,
  dogPlans
} = require('../mocks/dog')

describe('Environment / run()', () => {
  const human = new Agent('human', beliefs, desires, plans, preferenceFunctionGen)
  const dog = new Agent('dog', dogBeliefs, dogDesires, dogPlans, dogPreferenceFunctionGen)

  const state = {
    dogNice: true,
    dogHungry: true,
    foodAvailable: false,
    dogRecentlyPraised: false
  }

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
  const environment = new Environment([human, dog], state, updateMAS)

  it('Should allow agent-to-agent interaction', () => {
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
    expect(history).toEqual(expectedHistory)
  })
})
