/**
 * JS-son environment generator
 * @param {array} agents JS-son agents to run
 * @param {object} state Initial environment state
 * @param {function} update Update function, in particular for processing agent actions
 * @param {function} render Visualization function of the environment's current state
 * @param {function} stateFilter Function for filtering state that agents should receive
 * @param {function} runner Function that manages the next "tick"
 * @returns {object} JS-son environment object
*/
function Environment (
  agents,
  state,
  update,
  render = state => console.log(state),
  stateFilter = state => state,
  runner = run => iterations => {
    if (iterations) {
      Array(iterations).fill(0).forEach(run)
    } else {
      while (true) run()
    }
  }
) {
  state.messages = {}
  this.state = state
  this.agents = {}
  agents.forEach(agent => {
    this.agents[agent.id] = agent
    this.state.messages[agent.id] = {}
  })
  this.update = update
  this.render = render
  this.stateFilter = stateFilter
  this.history = []
  this.runner = runner
  this.reset = () => (this.history = [])
  this.run = iterations => {
    this.history.push(this.state)
    const run = () => {
      Object.keys(this.agents).forEach(agentKey => {
        const messages = {}
        Object.keys(this.state.messages).forEach(recipient => {
          Object.keys(this.state.messages[recipient]).forEach(sender => {
            if (recipient !== agentKey) {
              messages[sender] = []
              return
            }
            messages[sender] = this.state.messages[recipient][sender]
          })
        })
        const preFilteredState = { ...this.state, messages }
        const proposedUpdate = this.agents[agentKey].next(
          this.stateFilter(preFilteredState, agentKey, this.agents[agentKey].beliefs))
        proposedUpdate.forEach(action => {
          Object.keys(this.state.messages).forEach(key => {
            if (this.state.messages[key][agentKey]) this.state.messages[key][agentKey] = []
          })
          if (action.messages) {
            action.messages.forEach(
              message => {
                if (!this.state.messages[[message.agentId]][agentKey]) {
                  this.state.messages[[message.agentId]][agentKey] = []
                }
                this.state.messages[message.agentId][agentKey].push(message.message)
              }
            )
          }
        })
        const stateUpdate = this.update(proposedUpdate, agentKey, this.state)
        this.state = {
          ...this.state,
          ...stateUpdate
        }
      })
      this.history.push(this.state)
      this.render(this.state)
    }
    this.runner(run)(iterations)
    return this.history
  }
}

module.exports = Environment
