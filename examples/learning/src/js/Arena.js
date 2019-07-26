// import js-son and assign Belief, Plan, Agent, GridWorld, and FieldType to separate consts
import { Belief, Desire, Plan, Agent, GridWorld, FieldType } from 'js-son-agent'
// import JS-son learning extension
import { createNetwork, trainOnReplayBatch, determineAction } from './neuralNet'

const actionMapping = ['up', 'down', 'left', 'right']

/* desires */
const desires = {
  ...Desire('go', beliefs => {
    let action
    console.log(`epsilon: ${beliefs.epsilon}`)
    if (Math.random() < beliefs.epsilon) {
      action = actionMapping[Math.floor(Math.random() * actionMapping.length)]
    } else {
      const transformedState = transformState(beliefs.fields, beliefs.position, beliefs.positions)
      action = determineAction(transformedState, actionMapping, beliefs.policy)
    }
    return action
  })
}

const plans = [
  Plan(
    desires => desires.go === 'up',
    () => ({ go: 'up' })
  ),
  Plan(
    desires => desires.go === 'down',
    () => ({ go: 'down' })
  ),
  Plan(
    desires => desires.go === 'left',
    () => ({ go: 'left' })
  ),
  Plan(
    desires => desires.go === 'right',
    () => ({ go: 'right' })
  )
]

/* helper function to determine the field types of an agent's neighbor fields */
const determineNeighborStates = (position, state) => ({
  up: position + 20 >= 400 ? undefined : state.fields[position + 20],
  down: position - 20 < 0 ? undefined : state.fields[position - 20],
  left: position % 20 === 0 ? undefined : state.fields[position - 1],
  right: position % 20 === 1 ? undefined : state.fields[position + 1]
})
/*
 dynamically generate agents that are aware of their own position and the types of neighboring
 fields
*/
const generateAgents = initialState => initialState.positions.map((position, index) => {
  const beliefs = {
    ...Belief('neighborStates', determineNeighborStates(position, initialState)),
    ...Belief('position', position),
    ...Belief('health', 100),
    ...Belief('epsilon', 0.5),
    ...Belief('coins', 0),
    ...Belief('memory', []),
    ...Belief('policy', createNetwork(20, 20, 4))
  }
  return new Agent(
    index,
    beliefs,
    desires,
    plans
  )
})

/* generate pseudo-random initial state */
const generateInitialState = () => {
  const dimensions = [20, 20]
  const positions = []
  const fields = Array(dimensions[0] * dimensions[1]).fill(0).map((_, index) => {
    const rand = Math.random()
    if (rand < 0.1) {
      return 'mountain'
    } else if (rand < 0.15) {
      return 'diamond'
    } else if (rand < 0.20) {
      return 'repair'
    } else if (rand < 0.22 && positions.length < 2) {
      positions.push(index)
      return 'plain'
    } else {
      return 'plain'
    }
  })
  return {
    dimensions,
    positions,
    coins: Array(2).fill(0),
    health: Array(2).fill(100),
    epsilons: Array(2).fill(0.5),
    fields,
    rewards: Array(2).fill([]),
    rewardsAcc: Array(2).fill(0),
    policies: Array(2).fill(createNetwork(20, 20, 4)),
    memories: Array(2).fill([])
  }
}

const generateConsequence = (state, agentId, newPosition, action) => {
  state.health[agentId] = state.health[agentId] - 1
  state.epsilons[agentId] = state.epsilons[agentId] - 0.01
  switch (state.fields[newPosition]) {
    case 'plain':
      if (state.positions.includes(newPosition)) {
        state.health = state.health.map((healthScore, index) => {
          if (state.positions[index] === newPosition) {
            if (state.health[index] <= 1) {
              state.positions[index] = undefined
            }
            return healthScore - 10
          } else {
            return healthScore
          }
        })
      } else {
        state.positions[agentId] = newPosition
      }
      break
    case 'diamond':
      state.coins[agentId]++
      state.rewards[agentId] = 1
      break
    case 'repair':
      if (state.health[agentId] < 100) state.health[agentId] = state.health[agentId] + 10
      break
  }
  state.health[agentId] = state.health[agentId] - 1
  if (state.health[agentId] <= 0) {
    state.rewards[agentId] = -100
    state.health[agentId] = 100
    state.coins[agentId] = -100
  }
  state.rewards[agentId] = typeof state.rewards[agentId] === 'number' ? state.rewards[agentId] : 0
  console.log(`reward ${agentId}: ${state.rewards[agentId]} (${typeof state.rewards[agentId]})`)
  state.rewardsAcc[agentId] = state.rewardsAcc[agentId] + state.rewards[agentId]
  state.memories[agentId].push(
    transformState(
      state.fields,
      state.positions[agentId],
      state.positions.filter((_, index) => index !== agentId)
    ),
    action,
    state.rewards[agentId]
  )
  state.policies[agentId] = trainOnReplayBatch(
    0.99,
    [
      state.memories[agentId][state.memories[agentId].length - 1]
    ],
    state.policies[agentId])
  return state
}

const trigger = (actions, agentId, state, position) => {
  const action = actions[0].go
  switch (actions[0].go) {
    case 'up':
      if (position && position + 20 < 400) {
        state = generateConsequence(state, agentId, position + 20, action)
      }
      break
    case 'down':
      if (position && position - 20 >= 0) {
        state = generateConsequence(state, agentId, position - 20, action)
      }
      break
    case 'left':
      if (position && position % 20 !== 0) {
        state = generateConsequence(state, agentId, position - 1, action)
      }
      break
    case 'right':
      if (position && position % 20 !== 1) {
        state = generateConsequence(state, agentId, position + 1, action)
      }
      break
  }
  return state
}

const stateFilter = (state, agentId, agentBeliefs) => ({
  ...agentBeliefs,
  coins: state.coins[agentId],
  health: state.health[agentId],
  neighborStates: determineNeighborStates(state.positions[agentId], state),
  fields: state.fields,
  positions: state.positions.filter((_, index) => index !== agentId),
  epsilon: state.epsilons[agentId],
  policy: state.policies[agentId],
  memory: state.memories[agentId]
})

const fieldTypes = {
  mountain: FieldType(
    'mountain',
    () => 'mountain-field material-icons mountain',
    () => '^',
    trigger
  ),
  diamond: FieldType(
    'diamond',
    () => 'diamond-field material-icons money',
    () => 'v',
    trigger
  ),
  repair: FieldType(
    'repair',
    () => 'repair-field material-icons build',
    () => 'F',
    trigger
  ),
  plain: FieldType(
    'plain',
    (state, position) => state.positions.includes(position)
      ? 'plain-field material-icons robot'
      : 'plain-field',
    (state, position) => state.positions.includes(position)
      ? 'R'
      : '-',
    trigger,
    (state, position) => state.positions.includes(position)
      ? `<div class="field-annotation">${state.positions.indexOf(position)}</div>`
      : ''
  )
}

const Arena = () => {
  const initialState = generateInitialState()
  return new GridWorld(
    generateAgents(initialState),
    initialState,
    fieldTypes,
    stateFilter
  )
}

function transformState (state, selfPosition, otherPositions) {
  const newState = {
    mountain: [],
    diamond: [],
    repair: [],
    self: [selfPosition],
    others: otherPositions
  }
  state.forEach((field, index) => {
    switch (field) {
      case 'mountain':
        newState.mountain.push(index)
        break
      case 'diamond':
        newState.mountain.push(index)
        break
      case 'repair':
        newState.mountain.push(index)
        break
      case 'agent':
        newState.mountain.push(index)
        break
      default:
        break
    }
  })
  return newState
}

export default Arena
