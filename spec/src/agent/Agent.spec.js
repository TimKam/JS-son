const Belief = require('../../../src/agent/Belief')
const FunctionalBelief = require('../../../src/agent/FunctionalBelief')
const Plan = require('../../../src/agent/Plan')
const Agent = require('../../../src/agent/Agent')

const {
  beliefs,
  desires,
  preferenceFunctionGen,
  plans
} = require('../../mocks/human')
const Goal = require('../../../src/agent/Goal')

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
    expect(() => newAgent.next()).toThrow()
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
    expect(() => newAgent.next()).toThrow()
  })

  it('should support a custom belief revision function that rejects belief updates from the environment', () => {
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

  it('should support a custom goal revision function, e.g. to determine which goals are active, which inactive', () => {
    const beliefs = {
      ...Belief('dogNice', false)
    }
    const goals = {
      praiseDog: Goal('praiseDog', false, { dogName: 'Hasso' })
    }
    const reviseGoals = (beliefs, goals) => {
      if (beliefs.dogNice) {
        goals.praiseDog.isActive = true
      }
      return goals
    }
    const plans = [ Plan(goals.praiseDog, (belief, goalValue) => ({ action: `Good dog, ${goalValue.dogName}!` })) ]
    const newAgent = new Agent({
      id: 'MyAgent',
      beliefs,
      goals,
      plans,
      reviseGoals
    })
    expect(newAgent.next({ ...Belief('dogNice', true) })[0].action).toEqual('Good dog, Hasso!')
  })

  it('should support integrated goal and belief revision', () => {
    const beliefs = {
      ...Belief('dogNice', false)
    }
    const goals = {
      praiseDog: Goal('praiseDog', false, { dogName: 'Hasso' })
    }
    const reviseBeliefs = () => {
      return { dogNice: true }
    }
    const reviseGoals = (beliefs, goals) => {
      if (beliefs.dogNice) {
        goals.praiseDog.isActive = true
      }
      return goals
    }
    const plans = [ Plan(goals.praiseDog, (belief, goalValue) => ({ action: `Good dog, ${goalValue.dogName}!` })) ]
    const newAgent = new Agent({
      id: 'MyAgent',
      beliefs,
      goals,
      plans,
      reviseBeliefs,
      reviseGoals
    })
    expect(newAgent.next({ ...Belief('dogNice', false) })[0].action).toEqual('Good dog, Hasso!')
  })

  it('should correctly revise functional beliefs, given new beliefs', () => {
    const oldBeliefs = {
      isRaining: Belief('isRaining', true, 0),
    }

    const isSlippery = FunctionalBelief('isSlippery', false, (_, newBeliefs) => newBeliefs.isRaining.value, 1)

    const newBeliefs1 = {
      isRaining: Belief('isRaining', false, 0),
      isSlippery
    }

    const newBeliefs2 = {
      isRaining: Belief('isRaining', true, 0),
      isSlippery
    }

    const newAgent = new Agent({
      id: 'myAgent',
      beliefs: oldBeliefs,
      desires,
      plans
    })
    newAgent.next(newBeliefs1)
    expect(newAgent.beliefs.isSlippery.value).toBe(false)
    newAgent.next(newBeliefs2)
    expect(newAgent.beliefs.isSlippery.value).toBe(true)
  })

  it('should correctly revise functional beliefs, given new and old beliefs', () => {
    const oldBeliefs = {
      isRaining: Belief('isRaining', true, 0),
    }

    const isSlippery = FunctionalBelief(
      'isSlippery',
      false,
      (oldBeliefs, newBeliefs) =>
        (newBeliefs.isRaining && newBeliefs.isRaining.value) ||
        (!newBeliefs.isRaining && oldBeliefs.isRaining && oldBeliefs.isRaining.value),
      1
    )

    const newBeliefs1 = {
      isSlippery
    }

    const newBeliefs2 = {
      isSlippery,
      isRaining: Belief('isRaining', false, 0)
    }

    const newAgent = new Agent({
      id: 'myAgent',
      beliefs: oldBeliefs,
      desires,
      plans
    })
    newAgent.next(newBeliefs1)
    expect(newAgent.beliefs.isSlippery.value).toBe(true)
    newAgent.next(newBeliefs2)
    expect(newAgent.beliefs.isSlippery.value).toBe(false)
  })
})
