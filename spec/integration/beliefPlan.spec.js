/* Integration test for simplified belief-plan approach */
const {
  Belief,
  Desire, // eslint-disable-line no-unused-vars
  Intentions, // eslint-disable-line no-unused-vars
  Plan,
  Agent,
  Environment
} = require('../../src/js-son')

describe('Integration: belief-plan approach', () => {
  const createAgent = (type) => {
    const beliefs = {
      ...Belief('dogNice', true),
      ...Belief('dogHungry', false)
    }
    if (type === 'human') {
      const plans = [
        Plan(beliefs => beliefs.dogNice, () => ({
          actions: ['Good dog!']
        })),
        Plan(beliefs => beliefs.dogHungry, () => ({
          actions: ['Here, take some food!']
        }))
      ]
      return new Agent('human', beliefs, {}, plans)
    } else {
      beliefs.foodAvailable = false
      beliefs.dogRecentlyPraised = false
      const plans = [
        Plan(beliefs => beliefs.dogHungry && beliefs.foodAvailable, () => ({
          actions: ['Eat']
        })),
        Plan(beliefs => beliefs.dogRecentlyPraised, () => ({
          actions: ['Wag tail']
        }))
      ]
      return new Agent('dog', beliefs, {}, plans)
    }
  }

  const human = createAgent('human')
  const dog = createAgent('dog')

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
