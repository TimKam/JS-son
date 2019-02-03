/**
 * JS-son environment generator
 * @param {object} agents JS-son agents to run
 * @param {object} state Initial environment state
 * @param {function} update Update function, in particular for processing agent actions
 * @param {function} render Visualization function of the environment's current state
 * @param {function} stateFilter Function for filtering state that agents should receive
 * @returns {object} JS-son environment object
*/
function Environment (
  agents,
  state,
  update,
  render = () => console.log(state),
  stateFilter = state => state
) {
  this.agents = {}
  agents.forEach(agent => (this.agents[agent.id] = agent))
  this.state = state
  this.update = update
  this.render = render
  this.stateFilter = stateFilter
  this.run = iterations => {
    const run = () => {
      Object.keys(this.agents).forEach(agentKey => {
        const proposedUpdate = agents[agentKey].next(this.stateFilter(this.state))
        this.state = {
          ...this.state,
          ...update(proposedUpdate)
        }
      })
      this.render(this.state)
    }
    if (iterations) {
      Array(iterations).forEach(run())
    } else {
      while (true) run()
    }
  }
}

export default Environment
