const Environment = require('./Environment')

/**
 * JS-son grid world environment
 * @param {array} agents JS-son agents to run
 * @param {object} state Initial environment state
 * @param {object} fieldTypes Object: all field types (id: {...properties}) the environment supports
 * @param {function} stateFilter Function for filtering state that agents should receive
 * @returns {object} JS-son environment object with grid world render function
 */
function GridWorld (
  agents,
  state,
  fieldTypes,
  stateFilter = state => state
) {
  const renderBrowser = (state, fieldTypes) => [].concat(
    '<table>',
    state.fields.map((field, index) => {
      let worldSnippet = ''
      if (index % state.dimensions[0] === 0) worldSnippet += '<tr>'
      worldSnippet += fieldTypes[field].render(state, index)
      if (index % state.dimensions[0] === state.dimensions[0] - 1) worldSnippet += '</tr>'
      return worldSnippet
    }),
    '</table>'
  ).join('')

  const renderNode = (state, fieldTypes) => [].concat(
    '****',
    state.fields.map((field, index) => {
      let worldSnippet = ''
      if (index % state.dimensions[0] === 0) worldSnippet += '\r\n'
      worldSnippet += fieldTypes[field].render(state, index, false)
      return worldSnippet
    }),
    '\r\n****'
  ).join('')

  const render = (state, fieldTypes) =>
    typeof window === 'undefined'
      ? renderNode(state, fieldTypes)
      : renderBrowser(state, fieldTypes)

  const update = (actions, agentId, state, fieldTypes) => {
    const agentPosition = state.positions[agentId]
    if (agentPosition) {
      const fieldType = fieldTypes[state.fields[agentPosition]]
      return {
        ...state,
        ...fieldType.trigger(actions, agentId, state, agentPosition)
      }
    } else { // inactive or "dead" agents may have undefined position
      return state
    }
  }

  return new Environment(
    agents,
    state,
    (actions, agentId, currentState) => update(actions, agentId, state, fieldTypes),
    state => render(state, fieldTypes),
    stateFilter
  )
}

module.exports = GridWorld
