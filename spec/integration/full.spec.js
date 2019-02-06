/* Integration test for simplified belief-plan approach */
const {
  Belief,
  Desire,
  Intentions, // eslint-disable-line no-unused-vars
  Plan,
  Agent,
  Environment
} = require('../../src/js-son')

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
      beliefs.foodAvailable = false
      beliefs.dogRecentlyPraised = false
      const desires = {
        ...Desire('wagTail', beliefs => beliefs.recentlyPraised),
        ...Desire('eat', beliefs => beliefs.foodAvailable && beliefs.dogHungry)
      }
      const preferenceFunctionGen = (beliefs, desires) => desireKey => {
        if (!desires[desireKey](beliefs)) {
          return false
        } else if (desireKey === 'eat' || !desires['eat'](beliefs)) {
          return true
        } else {
          return false
        }
      }
      const plans = [
        Plan(intentions => intentions.eat, () => ({
          actions: ['Eat']
        })),
        Plan(intentions => intentions.wagTail, () => ({
          actions: ['Wag tail']
        }))
      ]
      return new Agent('dog', beliefs, desires, plans, preferenceFunctionGen)
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
