const Belief = require('../../../src/agent/Belief')

describe('belief()', () => {
  console.warn = jasmine.createSpy('log')

  it('should create a new belief with the specified key and value', () => {
    expect(Belief('test', 'test')).toEqual({ test: 'test' })
  })

  it('should throw a warning if belief is not JSON.stringify-able', () => {
    // eslint-disable-next-line no-unused-vars
    const belief = Belief('test', () => 'test')
    expect(console.warn).toHaveBeenCalledWith('JS-son: Created belief with non-JSON object value')
  })

  it('should not throw warning if belief is JSON.stringify-able', () => {
    // eslint-disable-next-line no-unused-vars
    const belief = Belief('test', {})
    expect(console.warn).not.toHaveBeenCalledWith({})
  })
})
