const Agent = require('../../../src/agent/Agent')
const Plan = require('../../../src/agent/Plan')
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

const emptyMessageObject = { human: {}, dog: {} }

describe('Environment / run()', () => {
  const human = new Agent('human', beliefs, desires, plans, preferenceFunctionGen)
  const dog = new Agent('dog', dogBeliefs, dogDesires, dogPlans, dogPreferenceFunctionGen)

  const state = {
    dogNice: true,
    dogHungry: true
  }

  const update = actions => (actions.some(
    action => action.actions &&
      action.actions.includes('Here, take some food!')) ? { dogHungry: false } : {}
  )

  it('Should process agent actions', () => {
    const environment = new Environment([human], state, update)
    environment.run(1)
    expect(console.log).toHaveBeenCalledWith(
      { dogNice: true, dogHungry: false, messages: { human: {} } }
    )
  })

  it('Should allow agent-to-agent interaction', () => {
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

  it('Should terminate after the specified number of iterations', () => {
    const environment = new Environment([human], state, update)
    const history = environment.run(2)
    const expectedHistory = [
      { dogNice: true, dogHungry: true, messages: { human: {} } },
      { dogNice: true, dogHungry: false, messages: { human: {} } },
      { dogNice: true, dogHungry: false, messages: { human: {} } }
    ]
    expect(history).toEqual(expectedHistory)
  })

  it('Should allow for the specification of a custom runner function', () => {
    const environment = new Environment(
      [human, dog],
      state,
      update,
      state => console.log(state),
      state => state
    )
    const history = environment.run(2)
    const expectedHistory = [
      { dogNice: true, dogHungry: true, messages: emptyMessageObject },
      { dogNice: true, dogHungry: false, messages: emptyMessageObject },
      { dogNice: true, dogHungry: false, messages: emptyMessageObject }
    ]
    expect(history).toEqual(expectedHistory)
  })

  it('Should allow for agent-specific state-filtering', () => {
    const stateFilter1 = (state, agentId) => {
      if (agentId === 'human') {
        return {
          ...state,
          dogNice: false
        }
      }
      return state
    }
    const stateFilter2 = (state, agentId) => {
      if (agentId === 'dog') {
        return {
          ...state,
          dogNice: false
        }
      }
      return state
    }
    const history1 = new Environment(
      [human, dog],
      state,
      update,
      state => console.log(state),
      stateFilter1
    ).run(2)
    const expectedHistory1 = [
      { dogNice: true, dogHungry: true, messages: emptyMessageObject },
      { dogNice: true, dogHungry: true, messages: emptyMessageObject },
      { dogNice: true, dogHungry: true, messages: emptyMessageObject }
    ]
    expect(history1).toEqual(expectedHistory1)
    const history2 = new Environment(
      [human, dog],
      state,
      update,
      state => console.log(state),
      stateFilter2
    ).run(2)
    const expectedHistory2 = [
      { dogNice: true, dogHungry: true, messages: emptyMessageObject },
      { dogNice: true, dogHungry: false, messages: emptyMessageObject },
      { dogNice: true, dogHungry: false, messages: emptyMessageObject }
    ]
    expect(history2).toEqual(expectedHistory2)
  })

  it('Should allow for agent-to-agent message passing', () => {
    const messagePlans = [
      Plan(_ => true, () => ({ messages: [{ message: 'Hi!', agentId: 'human' }] }))
    ]
    const filledMessageObject = {
      ...emptyMessageObject,
      human2: {},
      human: { human2: ['Hi!'] }
    }
    const human2 = new Agent('human2', beliefs, desires, messagePlans, preferenceFunctionGen)
    const env = new Environment(
      [human, human2, dog],
      state,
      update
    )
    const history = env.run(2)
    const expectedHistory = [
      { dogNice: true, dogHungry: true, messages: filledMessageObject },
      { dogNice: true, dogHungry: false, messages: filledMessageObject },
      { dogNice: true, dogHungry: false, messages: filledMessageObject }
    ]
    expect(history).toEqual(expectedHistory)
    expect(env.agents.human.beliefs.messages.human2).toContain('Hi!')
    expect(env.agents.human.beliefs.messages.human2.length).toEqual(1)
    expect(env.agents.human2.beliefs.messages.human2.length).toEqual(0)
    expect(env.agents.dog.beliefs.messages.human2.length).toEqual(0)
  })
})
