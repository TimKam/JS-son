Belief = require('../../../src/agent/belief')
Desire = require('../../../src/agent/desire')

describe('Desire()', () => {

    console.warn = jasmine.createSpy('log')
    const beliefs = { ...Belief('dogNice', true) }

    it('should create a new desire with the specified key and value',  () => {
        const desire = Desire('playWithDog', beliefs => beliefs.dogNice)
        expect(desire.playWithDog(beliefs)).toBe(true)
    })

    it('should throw a warning if desire body is not a function',  () => {
        const testBelief = Desire('test', 'test')
        expect(console.warn).toHaveBeenCalledWith('JS-son: desire body should be a function')
    })

    it('should not throw warning if desire body is a function',  () => {
        const validDesire = Desire('playWithDog', beliefs => beliefs.dogNice)
        expect(console.warn).not.toHaveBeenCalledWith({})
    })
})