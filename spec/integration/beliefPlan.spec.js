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

const { updateMAS } = require('../mocks/environment')

describe('Integration: belief-plan approach', () => {
  const human = new Agent('human', beliefs, desires, plans, preferenceFunctionGen)
  const dog = new Agent('dog', dogBeliefs, dogDesires, dogPlans, dogPreferenceFunctionGen)
  const emptyMessageObject = { human: {}, dog: {} }

  const state = {
    dogNice: true,
    dogHungry: true,
    foodAvailable: false,
    dogRecentlyPraised: false
  }

  const environment = new Environment([human, dog], state, updateMAS)

  it('Should allow agent-to-agent interaction', () => {
    const history = environment.run(1)
    const expectedHistory = [{
      dogNice: true,
      dogHungry: true,
      foodAvailable: false,
      dogRecentlyPraised: false,
      messages: emptyMessageObject
    }, {
      dogNice: true,
      dogHungry: false,
      foodAvailable: false,
      dogRecentlyPraised: false,
      messages: emptyMessageObject
    }]
    expect(history).toEqual(expectedHistory)
  })
})
