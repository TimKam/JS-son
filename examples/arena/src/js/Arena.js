// import js-son and assign Belief, Plan, Agent, GridWorld, and FieldType to separate consts
import { Belief, Desire, Plan, Agent, GridWorld, FieldType } from 'js-son-agent'

/* desires */
const desires = {
  ...Desire('go', beliefs => { // states by keys index: 0: up, 1: down, 2: left, 3: right
    if (Math.random() < 0.25) { // random exploration
      return Object.keys(beliefs.neighborStates)[Math.floor(Math.random() * 4)]
    }
    const neighborsDiamond = Object.keys(beliefs.neighborStates).some(
      key => beliefs.neighborStates[key] === 'diamond'
    )
    const neighborsRepair = Object.keys(beliefs.neighborStates).some(
      key => beliefs.neighborStates[key] === 'repair'
    )
    const neighborsPlain = Object.keys(beliefs.neighborStates).some(
      key => beliefs.neighborStates[key] === 'plain'
    )
    if (neighborsDiamond) {
      return Object.keys(beliefs.neighborStates).find(
        key => beliefs.neighborStates[key] === 'diamond'
      )
    } else if (neighborsRepair) {
      return Object.keys(beliefs.neighborStates).find(
        key => beliefs.neighborStates[key] === 'repair'
      )
    } else if (neighborsPlain) {
      return Object.keys(beliefs.neighborStates).find(
        key => beliefs.neighborStates[key] === 'plain'
      )
    } else {
      return undefined
    }
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
    ...Belief('coins', 0)
  }
  return new Agent(
    index,
    beliefs,
    desires,
    plans
  )
})

/* generate pseudo-random initial state */
const generateInitialState = (numberAgents = 2) => {
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
    } else if (rand < 0.25 && positions.length < numberAgents) {
      positions.push(index)
      return 'plain'
    } else {
      return 'plain'
    }
  })
  return {
    dimensions,
    positions,
    coins: Array(numberAgents).fill(0),
    health: Array(numberAgents).fill(100),
    fields,
    rewards: Array(numberAgents).fill([])
  }
}

const genRandInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const generatePreferences = (utilityMapping, possibleStates) => {
  return ''
}

const generateReward = (state, agentId, newPosition) => {
  console.log('generateReward')
  console.log(arena.state.positions)
  const utilityMapping = {
    'diamondDiamond': 7,
    'repairDiamond': 7,
    'repairFullDiamond': -3,
    'deathDiamond': -100,
    'otherDiamond': -3,
    'diamondRepair': 7,
    'repairRepair': 7,
    'repairFullRepair': -3,
    'deathRepair': -100,
    'otherRepair': -3,
    'diamondRepairFull': 7,
    'repairRepairFull': 7,
    'repairFullRepairFull': -3,
    'deathRepairFull': -100,
    'otherRepairFull': -3,
    'diamondDeath': 10,
    'repairDeath': 10,
    'repairFullDeath': 0,
    'deathDeath': -100,
    'otherDeath': 0,
    'diamondOther': 10,
    'repairOther': 10,
    'repairFullOther': 0,
    'deathOther': -100,
    'otherOther': 0
  }
  const fieldMovedToSelf = ''
  const fieldMovedToOther = ''

  const preferences = generatePreferences = (utilityMapping, possibleStates)
  return ''
}

const generateConsequence = (state, agentId, newPosition) => {
  switch (state.fields[newPosition]) {
    case 'plain':
      if (state.positions.includes(newPosition)) {
        state.health = state.health.map((healthScore, index) => {
          if (state.positions[index] === newPosition) {
            if (state.health[index] <= 10) {
              state.positions[index] = undefined
            }
            healthScore = healthScore - 10
            return healthScore
          } else {
            return healthScore
          }
        })
        state.health[agentId] = state.health[agentId] - 10
        if (state.health[agentId] <= 0) {
          state.positions[agentId] = undefined
        }
      } else {
        state.positions[agentId] = newPosition
      }
      break
    case 'diamond':
      state.coins[agentId] = state.coins[agentId] + 10
      const coinDamage = genRandInt(1, 5)
      if (agentId === '1') {
        state.coins[0] = state.coins[0] - coinDamage
      } else {
        state.coins[1] = state.coins[1] - coinDamage
      }
      break
    case 'repair':
      if (state.health[agentId] < 10) state.health[agentId] = state.health[agentId] + 10
      const healthDamage = genRandInt(1, 5)
      if (agentId === '1') {
        state.health[0] = state.health[0] - healthDamage
        if (state.health[0] <= 0) {
          state.positions[0] = undefined
        }
      } else {
        state.health[1] = state.health[1] - healthDamage
        if (state.health[1] <= 0) {
          state.positions[1] = undefined
        }
      }
      break
  }
  if (agentId === '1') {
    state.rewards[0].push(generateReward(state, 0, state.fields[newPosition]))
    state.rewards[1].push(generateReward(state, 1, state.fields[newPosition]))
  }
  return state
}

const trigger = (actions, agentId, state, position) => {
  switch (actions[0].go) {
    case 'up':
      if (position && position + 20 < 400) {
        state = generateConsequence(state, agentId, position + 20)
      }
      break
    case 'down':
      if (position && position - 20 >= 0) {
        state = generateConsequence(state, agentId, position - 20)
      }
      break
    case 'left':
      if (position && position % 20 !== 0) {
        state = generateConsequence(state, agentId, position - 1)
      }
      break
    case 'right':
      if (position && position % 20 !== 1) {
        state = generateConsequence(state, agentId, position + 1)
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
  fullGridWorld: state.positions // fully observable
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

export default Arena
