// import DOM helper for render function
import $$ from 'dom7'
// import js-son and assign Belief, Plan, Agent, and Environment to separate consts
import { Belief, Plan, Agent, Environment } from 'js-son-agent'

/*
Note: beliefs will be created dynamically at a later stage
create plans all agents have the same plans, as the head of the plans determines the correct
action (being "active" or "inactive" in the next round) dynamically, based on the states of the
neighbors.
*/

/*
  determine how many neighbors of an agent are active
*/
const determineNeighborActivity = (index, activityArray) => {
  const leftNeighbors = index % 15 === 0
    ? []
    : [activityArray[index - 16], activityArray[index - 1], activityArray[index + 14]]

  const rightNeighbors = index % 15 === 14
    ? []
    : [activityArray[index - 14], activityArray[index + 1], activityArray[index + 16]]
  return [
    activityArray[index - 15],
    activityArray[index + 15]
  ].concat(leftNeighbors, rightNeighbors).filter(element => element).length
}

const plans = [ 
  Plan(
    () => true,
    (beliefs, goalValue) => {
      const neighborActivity = determineNeighborActivity(
        beliefs.index, beliefs.activityArray
      )
      const isActive = beliefs.activityArray[beliefs.index]
      return (
          isActive &&
          neighborActivity >= 2 &&
          neighborActivity < 4
      ) || neighborActivity === 3 ?
        { nextRound: 'active' } :
        { nextRound: 'inActive' }
})]

// generates initial activity state (active or inactive)
const generateInitialActivity = () => [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0,
  0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0,
  0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0,  
  0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
  0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0,  
  0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0,
  0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]

// generates 100 agents with provided initial activity state
const generateAgents = initialActivity => initialActivity.map((value, index) => {
  const beliefs = { ...Belief('index', index), ...Belief('activityArray', initialActivity) }
  return new Agent(index, beliefs, {}, plans)
})

/*
generate initial environment state
*/
const generateState = initialActivity => ({
  previousActivity: initialActivity,
  nextActivity: []
})

// state update function: collect future state of agents to assign new agent states next round
const updateState = (actions, agentId, currentState) => {
  const stateUpdate = {
    ...currentState
  }
  const agentActive = actions.some(action => action.nextRound === 'active')
  stateUpdate.nextActivity.push(agentActive)
  if (agentId == currentState.previousActivity.length - 1) {
    return {
      previousActivity: stateUpdate.nextActivity,
      nextActivity: []
    }
  }
  return stateUpdate
}

/* the state filter provides the agent with the ``currentState`` activity array that changes at the
end of each iteration */
const stateFilter = state => ({ activityArray: state.previousActivity })

// render environment's ``currentState`` as grid to DOM
const render = state => {
  if (state.nextActivity.length === 0) {
    const agentActivity = state.previousActivity
    const grid = agentActivity.map((value, index) => {
      const agentClass = value ? 'agent active-agent' : 'agent inactive-agent'
      if (index === 0) {
        return `<div class="row no-gap"><div class="col-5 ${agentClass}">_</div>`
      } else if (index % 15 === 0) {
        return `</div><div class="row no-gap"><div class="col-5 ${agentClass}">_</div>`
      } else if (index === 224) {
        return `<div class="col-5 ${agentClass}">_</div></div>`
      } else {
        return `<div class="col-5 ${agentClass}">_</div>`
      }
    }).join('')
    $$('#game-of-life-grid').html(grid)
  }
}

// instantiate game of life as new environment
const GameOfLife = () => {
  const initialActivity = generateInitialActivity()

  return new Environment(
    generateAgents(initialActivity),
    generateState(initialActivity),
    updateState,
    render,
    stateFilter
  )
}

export default GameOfLife
