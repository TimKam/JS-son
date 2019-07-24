/**
 * JS-son world field type generator
 * @param {string} id Unique identifier of field type
 * @param {function} generateClass Determines field's table cell class based on state, position
 * @param {function} generateCharRep Determines field's cli representation, based on state, position
 * @param {function} generateConsequence Determines effect of action in field to agent and env
 * @param {function} generateAnnotation Determines field's annotation, based on state, position
 * @returns {object} JS-son grid world field type
*/
const FieldType = (
  id,
  generateClass,
  generateCharRep,
  generateConsequence,
  generateAnnotation = () => ''
) => ({
  id,
  render: (state, position, browser = true) => browser
    ? `<td class="${generateClass(state, position)}">${generateAnnotation(state, position)}</td>`
    : generateCharRep(state, position),
  trigger: (actions, agentId, state, position) =>
    generateConsequence(actions, agentId, state, position)
})

module.exports = FieldType
