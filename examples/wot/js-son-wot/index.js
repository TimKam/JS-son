const { Belief, Agent } = require('js-son-agent')
const reviseBeliefsDefault = (oldBeliefs, newBeliefs) => ({ ...oldBeliefs, ...newBeliefs })

module.exports = {
  /**
   * Takes a WoT Scripting API `thing` and an array of JS-son plans, as well as an optional belief
   * revision function and turns it into a JS-son agent
   * @param {thing} thing WoT Scripting API `thing` that is to be agent-ified
   * @param {[plan]]} plans Array of JS-son plans
   * @returns {agent} JS-son agent
  */
  thingToAgent: (thing, plans, reviseBeliefs = reviseBeliefsDefault) => {
    const beliefs =
      Object.keys(thing.properties).map(
        propertyKey =>
          Belief(
            thing.properties[propertyKey].getName(),
            thing.properties[propertyKey].getState().value
          )
      ).reduce((a, b) => ({ ...a, ...b }))
    const agent = new Agent({
      id: thing.title,
      beliefs,
      plans,
      reviseBeliefs
    })
    return agent
  },
  /**
   * Takes a WoT Scripting API `thing`, a JS-son belief base and a list of thing properties and
   * updates the corresponding thing properties based on the belief base's beliefs with the same
   * identifier
   * @param {thing} thing WoT Scripting API `thing`
   * @param {[plan]]} plans Array of JS-son plans
   * @returns {agent} JS-son agent
  */
  updateThingProperties: (thing, beliefs, properties) => {
    properties.forEach(
      property =>
        thing.writeProperty(property, beliefs[property]))
    return thing
  }
}
