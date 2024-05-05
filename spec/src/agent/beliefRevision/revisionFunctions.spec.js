const Agent = require('../../../../src/agent/Agent')
const Belief = require('../../../../src/agent/Belief')
const {
  reviseSimpleNonmonotonic,
  reviseMonotonic,
  revisePriority } = require('../../../../src/agent/beliefRevision/revisionFunctions')

const {
  beliefs,
  desires,
  plans
} = require('../../../mocks/human')
  
describe('revisionFunctions', () => {

  it('by default, the belief revision function is simple non-monotonic and updates existing beliefs', () => {
    const newAgent = new Agent({
      id: 'myAgent',
      beliefs,
      desires,
      plans,
      selfUpdatesPossible: false
    })
    newAgent.next({ ...Belief('dogNice', false) })

    const alternativeAgent = new Agent({
      id: 'alternativeAgent',
      beliefs,
      desires,
      plans,
      selfUpdatesPossible: false,
      reviseBeliefs: reviseSimpleNonmonotonic
    })
    alternativeAgent.next({ ...Belief('dogNice', false) })
    expect(alternativeAgent.beliefs.dogNice).toBe(false)
    expect(alternativeAgent.beliefs.dogNice).toEqual(newAgent.beliefs.dogNice)
  })

  it('should support a monotonic belief revision function that rejects updates to existing beliefs', () => {
    const newAgent = new Agent({
      id: 'myAgent',
      beliefs,
      desires,
      plans,
      selfUpdatesPossible: false,
      reviseBeliefs: reviseMonotonic
    })
    newAgent.next({ ...Belief('dogNice', false), ...Belief('weather', 'sunny') })
    expect(newAgent.beliefs.dogNice).toBe(true)
    expect(newAgent.beliefs.weather).toBe('sunny')
  })

  it('should support a nonmonotonic belief revision function based on priority rules', () => {
    const beliefBase = {
      isRaining: Belief('isRaining', true, 0),
      temperature: Belief('temperature', 10, 0),
      propertyValue: Belief('propertyValue', 500000, 1)
    }

    const update = {
      isRaining: Belief('isRaining', false, 0),
      temperature: Belief('temperature', 15, 1),
      propertyValue: Belief('propertyValue', 250000, 0)
    }
    const newAgent = new Agent({
      id: 'myAgent',
      beliefs: beliefBase,
      desires,
      plans,
      selfUpdatesPossible: false,
      reviseBeliefs: revisePriority
    })
    newAgent.next(update)
    expect(newAgent.beliefs.isRaining.value).toBe(false)
    expect(newAgent.beliefs.temperature.value).toEqual(15)
    expect(newAgent.beliefs.propertyValue.value).toEqual(500000)
  })

  it('should not allow overriding beliefs of infinite high priority', () => {
    const beliefBase = {
      isRaining: Belief('isRaining', true, Infinity),
      temperature: Belief('temperature', 10, Infinity)
    }

    const update = {
      isRaining: Belief('isRaining', false, Infinity),
      temperature: Belief('temperature', 15, undefined)
    }
    const newAgent = new Agent({
      id: 'myAgent',
      beliefs: beliefBase,
      desires,
      plans,
      selfUpdatesPossible: false,
      reviseBeliefs: revisePriority
    })
    newAgent.next(update)
    expect(newAgent.beliefs.isRaining.value).toBe(true)
    expect(newAgent.beliefs.temperature.value).toEqual(10)
  })
})