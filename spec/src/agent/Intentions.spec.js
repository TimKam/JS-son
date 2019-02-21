const Belief = require('../../../src/agent/Belief')
const Intentions = require('../../../src/agent/Intentions')

const {
  desires
} = require('../../mocks/human')

describe('Intentions()', () => {
  const beliefs = { ...Belief('dogNice', true), ...Belief('dogHungry', true) }

  it('should filter intentions according to provided preference function', () => {
    const preferenceFunctionGen = (beliefs, desires) => (desireKey) => {
      if (!desires[desireKey](beliefs)) {
        return false
      } else if (desireKey === 'feedDog' || !desires['feedDog'](beliefs)) {
        return true
      } else {
        return false
      }
    }
    const intentions = Intentions(beliefs, desires, preferenceFunctionGen)
    expect(Object.keys(intentions)).toEqual(['feedDog'])
  })
})
