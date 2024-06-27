const FunctionalBelief = require('../../../src/agent/FunctionalBelief')

const beliefWarning = 'JS-son: Created belief with non-JSON object, non-JSON data type value'
const functionalBeliefWarning = 'JS-son: functional belief without proper two-argument function'

describe('FunctionalBelief()', () => {
  console.warn = jasmine.createSpy('warn')

  it('should create a new functional belief with the specified key, value, rule, and order', () => {
    const functionBelief = FunctionalBelief('isSlippery', false, (_, newBeliefs) => newBeliefs.isRaining.value, 0)
    expect(functionBelief.isSlippery).toEqual(false)
    expect(functionBelief.value).toEqual(false)
    expect(functionBelief.rule.toString()).toEqual(((_, newBeliefs) => newBeliefs.isRaining.value).toString())
    expect(functionBelief.order).toEqual(0)
  })

  it('should create a new functional belief with the specified key, value, rule, order, priority, and priority update spec', () => {
    const functionBelief = FunctionalBelief('isSlippery', false, (_, newBeliefs) => newBeliefs.isRaining.value, 0, 2)
    expect(functionBelief.isSlippery).toEqual(false)
    expect(functionBelief.value).toEqual(false)
    expect(functionBelief.rule.toString()).toEqual(((_, newBeliefs) => newBeliefs.isRaining.value).toString())
    expect(functionBelief.order).toEqual(0)
    expect(functionBelief.priority).toEqual(2)
  })

  it('should throw warning if base belief is not JSON.stringify-able & not of a JSON data type', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const functionBelief = FunctionalBelief('function', () => {}, (_, newBeliefs) => newBeliefs.isRaining, 0, 2)
    expect(console.warn).toHaveBeenCalledWith(beliefWarning)
  })

  it('should throw warning if rule is not a function', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const functionBelief = FunctionalBelief('isSlippery', false, true, 0, 2)
    expect(console.warn).toHaveBeenCalledWith(functionalBeliefWarning)
  })

  it('should throw warning if rule is a function that does not take exactly two arguments', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const functionBelief = FunctionalBelief('isSlippery', false, newBeliefs => newBeliefs.isRaining, 0)
    expect(console.warn).toHaveBeenCalledWith(functionalBeliefWarning)
  })
})
