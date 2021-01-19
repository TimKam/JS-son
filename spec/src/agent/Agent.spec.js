const Belief = require('../../../src/agent/Belief')
const Plan = require('../../../src/agent/Plan')
const Agent = require('../../../src/agent/Agent')

const {
  beliefs,
  desires,
  preferenceFunctionGen,
  plans
} = require('../../mocks/human')

describe('Agent / next()', () => {
  const agent = new Agent('myAgent', beliefs, desires, plans, preferenceFunctionGen)

  it('should not return inactive plans', () => {
    agent.start()
    expect(agent.next(beliefs).length).toEqual(1)
  })

  it('should return plan execution result for active plans', () => {
    agent.start()
    expect(agent.next({ ...beliefs, dogHungry: false })).toContain({
      actions: ['Good dog!']
    })
  })

  it('should return nothing if agent is inactive', () => {
    agent.stop()
    expect(agent.next(beliefs)).toEqual(undefined)
  })

  it('should allow belief updates', () => {
    agent.start()
    expect(agent.next({ ...Belief('dogNice', false) }).length).toEqual(0)
  })

  it('should apply the default preference function generation if no other is specified', () => {
    const defaultPreferenceAgent = new Agent('myAgent', beliefs, desires, plans)
    defaultPreferenceAgent.start()
    expect(defaultPreferenceAgent.next({ ...beliefs, dogHungry: true }).length).toEqual(2)
  })

  it('should allow belief updates as part of the agent\'s internal reasoning loop', () => {
    const newPlans = []
    newPlans.concat(plans)
    newPlans.push(Plan(
      () => true,
      function () {
        this.beliefs.test = true
        return {
          actions: ['Good dog!']
        }
      }
    ))
    const newAgent = new Agent('myAgent', beliefs, desires, newPlans, preferenceFunctionGen)
    newAgent.next()
    expect(newAgent.beliefs.test).toBe(true)
  })

  it('should not allow dynamic belief updates if this feature is deactivate', () => {
    const newPlans = []
    newPlans.concat(plans)
    newPlans.push(Plan(
      () => true,
      function () {
        this.beliefs.test = true
        return {
          actions: ['Good dog!']
        }
      }
    ))
    const newAgent = new Agent('myAgent', beliefs, desires, newPlans, preferenceFunctionGen, false)
    expect(() => newAgent.next()).toThrow(new TypeError("Cannot set property 'test' of undefined"))
  })

  it('should allow for a custom belief revision function that rejects belief updates from the environment', () => {
    const reviseBeliefs = (oldBeliefs, newBeliefs) => !newBeliefs.dogNice ? oldBeliefs : newBeliefs
    const newAgent = new Agent('myAgent', beliefs, desires, plans, undefined, false, reviseBeliefs)
    newAgent.next({ ...Belief('dogNice', false) })
    expect(newAgent.beliefs.dogNice).toBe(true)
  })
})

describe('Agent / next(), configuration object-based', () => {
  // repeat all tests with an agent that is instantiated with a single configuration object
  const agent = new Agent({
    id: 'myAgent',
    beliefs,
    desires,
    plans,
    determinePreferences: preferenceFunctionGen
  })
  it('should not return inactive plans', () => {
    agent.start()
    expect(agent.next(beliefs).length).toEqual(1)
  })

  it('should return plan execution result for active plans', () => {
    agent.start()
    expect(agent.next({ ...beliefs, dogHungry: false })).toContain({
      actions: ['Good dog!']
    })
  })

  it('should return nothing if agent is inactive', () => {
    agent.stop()
    expect(agent.next(beliefs)).toEqual(undefined)
  })

  it('should allow belief updates', () => {
    agent.start()
    expect(agent.next({ ...Belief('dogNice', false) }).length).toEqual(0)
  })

  it('should apply the default preference function generation if no other is specified', () => {
    const defaultPreferenceAgent = new Agent({
      id: 'myAgent',
      beliefs,
      desires,
      plans
    })
    defaultPreferenceAgent.start()
    expect(defaultPreferenceAgent.next({ ...beliefs, dogHungry: true }).length).toEqual(2)
  })

  it('should allow belief updates as part of the agent\'s internal reasoning loop', () => {
    const newPlans = []
    newPlans.concat(plans)
    newPlans.push(Plan(
      () => true,
      function () {
        this.beliefs.test = true
        return {
          actions: ['Good dog!']
        }
      }
    ))
    const newAgent = new Agent({
      id: 'myAgent',
      beliefs,
      desires,
      plans: newPlans,
      determinePreferences: preferenceFunctionGen
    })
    newAgent.next()
    expect(newAgent.beliefs.test).toBe(true)
  })

  it('should not allow dynamic belief updates if this feature is deactivated', () => {
    const newPlans = []
    newPlans.concat(plans)
    newPlans.push(Plan(
      () => true,
      function () {
        this.beliefs.test = true
        return {
          actions: ['Good dog!']
        }
      }
    ))
    const newAgent = new Agent({
      id: 'myAgent',
      beliefs,
      desires,
      plans: newPlans,
      determinePreferences: preferenceFunctionGen,
      selfUpdatesPossible: false
    })
    expect(() => newAgent.next()).toThrow(new TypeError("Cannot set property 'test' of undefined"))
  })

  it('should allow for a custom belief revision function that rejects belief updates from the environment', () => {
    const reviseBeliefs = (oldBeliefs, newBeliefs) => !newBeliefs.dogNice ? oldBeliefs : newBeliefs
    const newAgent = new Agent({
      id: 'myAgent',
      beliefs,
      desires,
      plans,
      selfUpdatesPossible: false,
      reviseBeliefs
    })
    newAgent.next({ ...Belief('dogNice', false) })
    expect(newAgent.beliefs.dogNice).toBe(true)
  })
})
