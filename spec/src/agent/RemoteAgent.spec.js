const RemoteAgent = require('../../../src/agent/RemoteAgent')

const {
  beliefs
} = require('../../mocks/human')

const next = () => ({ actions: ['Good dog!'] })

describe('Agent / next()', () => {
  const agent = new RemoteAgent('myAgent', beliefs, next)

  it('should return result of the specified `next` function', () => {
    agent.start()
    expect(agent.next({ ...beliefs, dogHungry: false })).toEqual({
      actions: ['Good dog!']
    })
  })

  it('should return nothing if agent is inactive', () => {
    agent.stop()
    expect(agent.next(beliefs)).toEqual(undefined)
  })
})
