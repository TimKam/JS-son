Belief = require('../../../src/agent/belief')
Desire = require('../../../src/agent/desire')
Intentions = require('../../../src/agent/intentions')

describe('Intentions()', () => {

    const beliefs = { ...Belief('dogNice', true), ...Belief('dogHungry', true) }
    const desires = {
        ...Desire('playWithDog', beliefs => beliefs.dogNice),
        ...Desire('feedDog', beliefs => beliefs.dogNice && beliefs.dogHungry)
    }

    it('should filter intentions according to provided preference function',  () => {
        const preferenceFunction = (desireKey) => {
            if(!desires[desireKey](beliefs)) {
                return false
            } else if (desireKey === 'feedDog' || !desires['feedDog'](beliefs)) {
                return true
            } else {
                return false
            }
        }
        const intentions = Intentions(beliefs, desires, preferenceFunction)
        expect(Object.keys(intentions)).toEqual(['feedDog']) 
    })
})
