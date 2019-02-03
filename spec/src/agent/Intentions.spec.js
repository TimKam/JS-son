const Belief = require('../../../src/agent/Belief')
const Desire = require('../../../src/agent/Desire')
const Intentions = require('../../../src/agent/Intentions')

describe('Intentions()', () => {
  const beliefs = { ...Belief('dogNice', true), ...Belief('dogHungry', true) }
  const desires = {
    ...Desire('playWithDog', beliefs => beliefs.dogNice),
    ...Desire('feedDog', beliefs => beliefs.dogNice && beliefs.dogHungry)
  }

  it('should filter intentions according to provided preference function', () => {
    const preferenceFunction = (desireKey) => {
      if (!desires[desireKey](beliefs)) {
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
