const Intentions = require('../../../src/agent/Intentions')
const Plan = require('../../../src/agent/Plan')
const Goal = require('../../../src/agent/Goal')

const {
  beliefs,
  desires,
  preferenceFunctionGen
} = require('../../mocks/human')

describe('Plan / run()', () => {
  const praiseDog = Plan(intentions => intentions.praiseDog, () => ({
    actions: ['Good dog!']
  }))

  it('should return ``null`` if head does not resolve to ``true``', () => {
    beliefs.dogHungry = true
    const intentions = Intentions(beliefs, desires, preferenceFunctionGen)
    expect(praiseDog.run(intentions)).toBe(null)
  })

  it('should return the result of its body if head resolves to ``true``', () => {
    beliefs.dogHungry = false
    const intentions = Intentions(beliefs, desires, preferenceFunctionGen)
    const expectedPlanResult = {
      actions: ['Good dog!']
    }
    expect(praiseDog.run(intentions)).toEqual(expectedPlanResult)
  })

  it('should allow for the access of beliefs/intentions in plans', () => {
    const praiseDog = Plan(_ => _.dogNice, _ => ({
      actions: [`Good dog, ${_.dogName}!`]
    }))
    const expectedPlanResult = {
      actions: ['Good dog, Hasso!']
    }
    beliefs.dogName = 'Hasso'
    expect(praiseDog.run(beliefs)).toEqual(expectedPlanResult)
  })

  it('should support goal-based plans', () => {
    const goal = Goal('praiseDog', true, { dogName: 'Hasso' })
    const praiseDog = Plan(goal, (beliefs, goalValue) => ({
      actions: [`Good dog, ${goalValue.dogName}!`]
    }))
    const expectedPlanResult = {
      actions: ['Good dog, Hasso!']
    }
    expect(praiseDog.run(beliefs, goal)).toEqual(expectedPlanResult)
  })

  it('should not trigger goal-based plans for active goals', () => {
    const goal = Goal('praiseDog', false, { dogName: 'Hasso' })
    const praiseDog = Plan(goal, (beliefs, goal) => ({
      actions: [`Good dog, ${goal.dogName}!`]
    }))
    expect(praiseDog.run(beliefs, goal)).toBe(null)
  })
})
