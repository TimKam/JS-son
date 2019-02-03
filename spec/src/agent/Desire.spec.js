const Belief = require('../../../src/agent/Belief')
const Desire = require('../../../src/agent/Desire')

describe('Desire()', () => {
  console.warn = jasmine.createSpy('log')
  const beliefs = { ...Belief('dogNice', true) }

  it('should create a new desire with the specified key and value', () => {
    const desire = Desire('playWithDog', beliefs => beliefs.dogNice)
    expect(desire.playWithDog(beliefs)).toBe(true)
  })

  it('should throw a warning if desire body is not a function', () => {
    // eslint-disable-next-line no-unused-vars
    const testBelief = Desire('test', 'test')
    expect(console.warn).toHaveBeenCalledWith('JS-son: desire body should be a function')
  })

  it('should not throw warning if desire body is a function', () => {
    // eslint-disable-next-line no-unused-vars
    const validDesire = Desire('playWithDog', beliefs => beliefs.dogNice)
    expect(console.warn).not.toHaveBeenCalledWith({})
  })
})
