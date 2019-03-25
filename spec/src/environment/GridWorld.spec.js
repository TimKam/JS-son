const Belief = require('../../../src/agent/Belief')
const Desire = require('../../../src/agent/Desire')
const Plan = require('../../../src/agent/Plan')
const Agent = require('../../../src/agent/Agent')
const GridWorld = require('../../../src/environment/GridWorld')
const FieldType = require('../../../src/environment/FieldType')

const desires = {
  ...Desire('go', beliefs => beliefs.testBelief === 1 ? 'right' : 'left')
}

const plans = [
  Plan(desires => desires.go === 'right', () => ({ go: 'right' })),
  Plan(desires => desires.go === 'left', () => ({ go: 'left' }))
]

const agents = [1, 2, 3].map(value => new Agent(
  value,
  { ...Belief('testBelief', value) },
  desires,
  plans
))

const fieldType = FieldType(
  'plain',
  (state, position) => state.positions.includes(position)
    ? 'a'
    : 'b',
  (state, position) => state.positions.includes(position)
    ? 'R'
    : '-',
  (actions, _, state, __) => ({ ...state, action: actions[0] }),
  (state, position) => state.positions.includes(position)
    ? `<div">${state.positions.indexOf(position)}</div>`
    : ''
)

const gridWorld = new GridWorld(
  agents,
  {
    positions: [1, 2, 3],
    dimensions: [4, 4],
    fields: Array(4 * 4).fill('plain')
  },
  { plain: fieldType }
)

const newWorldState = gridWorld.run(1)

describe('GridWorld / run()', () => {
  it('Should process agent actions as specified', () => {
    expect(newWorldState.slice(-1)[0].action.go).toEqual('left')
  })

  it('Should terminate after the specified number of iterations', () => {
    expect(gridWorld.history.length).toEqual(2)
  })

  it('Should be able to handle "dead"/inactive agents with ``undefined`` position', () => {
    gridWorld.reset()
    gridWorld.state.positions[1] = undefined
    gridWorld.run(1)
    expect(gridWorld.history.length).toEqual(2)
    expect(gridWorld.render(gridWorld.state)).toEqual([
      '****\r\n',
      '-R-R\r\n',
      '----\r\n',
      '----\r\n',
      '----\r\n',
      '****'
    ].join(''))
  })

  it('Should render the GridWorld correctly', () => {
    gridWorld.reset()
    gridWorld.state.positions[1] = 2
    gridWorld.run(1)
    expect(gridWorld.render(gridWorld.state)).toEqual([
      '****\r\n',
      '-RRR\r\n',
      '----\r\n',
      '----\r\n',
      '----\r\n',
      '****'
    ].join(''))
  })
})
