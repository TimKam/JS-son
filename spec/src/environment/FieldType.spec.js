const FieldType = require('../../../src/environment/FieldType')

describe('FieldType', () => {
  const fieldType = FieldType(
    'plain',
    (state, position) => state.positions.includes(position)
      ? 'plain-field material-icons robot'
      : 'plain-field',
    (state, position) => state.positions.includes(position)
      ? 'R'
      : '-',
    (actions, _, state, __) => ({ ...state, action: actions[0] }),
    (state, position) => state.positions.includes(position)
      ? `<div class="field-annotation">${state.positions.indexOf(position)}</div>`
      : ''
  )

  const state = {
    positions: [10, 20],
    health: [25, 20]
  }

  const actions = [{ go: 'up' }]

  it('Should render field as specified by generateClass / generateAnnotation functions', () => {
    expect(fieldType.render(state, undefined)).toEqual('<td class="plain-field"></td>')
    expect(fieldType.render(state, 10)).toEqual(
      '<td class="plain-field material-icons robot"><div class="field-annotation">0</div></td>'
    )
  })

  it('Should render field as specified by generateCharRep function', () => {
    expect(fieldType.render(state, 1, false)).toEqual('-')
    expect(fieldType.render(state, 20, false)).toEqual('R')
  })

  it('Should execute the "generateConsequence" function when triggered', () => {
    expect(fieldType.trigger(actions, 0, state, 1)).toEqual(
      { ...state, action: { go: 'up' } }
    )
  })
})
