const Belief = require('../../../src/agent/Belief')
const Agent = require('../../../src/agent/Agent')

const {
  beliefs,
  desires,
  preferenceFunctionGen,
  plans
} = require('../../mocks/human')

describe('Agent / next()', () => {
  const agent = new Agent('myAgent', beliefs, desires, plans, preferenceFunctionGen)

  it('should not return inactive plans', () => {
    agent.start()
    expect(agent.next(beliefs).length).toEqual(1)
  })

  it('should return plan execution result for active plans', () => {
    agent.start()
    expect(agent.next(beliefs)[0]).toEqual({
      actions: ['Good dog!']
    })
  })

  it('should return nothing if agent is inactive', () => {
    agent.stop()
    expect(agent.next(beliefs)).toEqual(undefined)
  })

  it('should allow belief updates', () => {
    agent.start()
    expect(agent.next({ ...Belief('dogNice', false) }).length).toEqual(0)
  })
})
