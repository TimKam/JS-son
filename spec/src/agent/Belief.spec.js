const Belief = require('../../../src/agent/Belief')

const warning = 'JS-son: Created belief with non-JSON object, non-JSON data type value'

describe('Belief()', () => {
  console.warn = jasmine.createSpy('warn')

  it('should create a new belief with the specified key and value', () => {
    expect(Belief('test', 'test')).toEqual({ test: 'test' })
  })

  it('should create a new belief with the specified key, value (explicitly managed), priority, and priority update spec', () => {
    expect(Belief('test', 'test', 1)).toEqual({ test: 'test', value: 'test', priority: 1, updatePriority: false })
  })

  it('should not throw a warning if belief is of a JSON data type', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const beliefs = {
      ...Belief('number', 1),
      ...Belief('string', 'string'),
      ...Belief('null', null),
      ...Belief('array', [])
    }
    expect(console.warn).not.toHaveBeenCalledWith(warning)
  })

  it('should not throw warning if belief is JSON.stringify-able', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const belief = Belief('object', {})
    expect(console.warn).not.toHaveBeenCalledWith(warning)
  })

  it('should throw warning if belief isn\'t JSON.stringify-able & not of a JSON data type', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const belief = Belief('function', () => {})
    expect(console.warn).toHaveBeenCalledWith(warning)
  })
})
