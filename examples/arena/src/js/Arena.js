// import js-son and assign Belief, Plan, Agent, GridWorld, and FieldType to separate consts
import { Belief, Desire, Plan, Agent, GridWorld, FieldType } from 'js-son-agent'

var RL = require('./rl.js')

const actionMapping = ['up', 'down', 'left', 'right']
const fieldMapping = { 'mountain': 0, 'plain': 0.2, 'diamond': 0.4, 'repair': 0.6 }
const fieldOwnEffects = { 'mountain': 'Nothing', 'plain': 'Nothing', 'diamond': 'GetCoins', 'repair': 'GetHealth' }
const fieldPartnerEffects = { 'mountain': 'Nothing', 'plain': 'Nothing', 'diamond': 'LoseCoins', 'repair': 'LoseHealth' }
const RLEnv = {
  getNumStates: () => 404,
  getMaxNumActions: () => 4
}

/* desires */
const desiresRL = {
  ...Desire('go', beliefs => {
    // before we have not issued any command, there is no reward (only for first iteration)
    if (!Array.isArray(beliefs.reward)) {
      beliefs.policy.learn(beliefs.reward)
    }

    var stateVector = beliefs.fullGridWorld.map(field => fieldMapping[field])
    stateVector[beliefs.positions[0]] = 0.8
    stateVector[beliefs.positions[1]] = 1.0
    stateVector.push(beliefs.health/100)
    stateVector.push(beliefs.coins)
    stateVector.push(beliefs.partnerHealth/100)
    stateVector.push(beliefs.partnerCoins)

    const a = beliefs.policy.act(stateVector)

    const newEpsilon = Math.max(0.01, beliefs.policy.epsilon*0.99);
    //console.log("newEpsilon", newEpsilon);
    beliefs.policy.epsilon = newEpsilon; 

    return actionMapping[a]
  }),
  ...Desire('preferences', beliefs => {
    const ownPreferences = generatePreferences(beliefs.health)

    const partnerId = 1 - beliefs.agentId
    const partnerStates = determineNeighborStates(beliefs.positions[partnerId], beliefs.fullGridWorld)

    const prefs = {}

    Object.keys(beliefs.neighborStates).filter(key => beliefs.neighborStates[key]).forEach(ownKey => {
      const ownEffect = fieldOwnEffects[beliefs.neighborStates[ownKey]]

      Object.keys(beliefs.neighborStates).filter(key => partnerStates[key]).forEach(partnerKey => {
        const partnerEffect = fieldPartnerEffects[partnerStates[partnerKey]]

        let actionCombination
        if (beliefs.agentId === '0') {
          actionCombination = ownKey + capitalize(partnerKey)
        } else {
          actionCombination = partnerKey + capitalize(ownKey)
        }

        let partnerEffectOnMe = ''
        if (partnerEffect === 'GetHealth') partnerEffectOnMe = 'LoseHealth'
        if (partnerEffect === 'GetCoins') partnerEffectOnMe = 'LoseCoins'

        const combinedEffect = ownEffect + partnerEffectOnMe
        prefs[actionCombination] = ownPreferences.indexOf(combinedEffect)
        if (ownPreferences.indexOf(combinedEffect) < 0) {
          console.log(actionCombination, combinedEffect)
        }
      })
    })
    const items = Object.keys(prefs).map(key => [key, prefs[key]])
    return items.sort((first, second) => second[1] - first[1]).map(el => el[0])
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
const determineNeighborStates = (position, fields) => ({
  up: position + 20 >= 400 ? undefined : fields[position + 20],
  down: position - 20 < 0 ? undefined : fields[position - 20],
  left: position % 20 === 0 ? undefined : fields[position - 1],
  right: position % 20 === 1 ? undefined : fields[position + 1]
})
/*
 dynamically generate agents that are aware of their own position and the types of neighboring
 fields
*/
const generateAgents = initialState => initialState.positions.map((position, index) => generateAgent(position, index, initialState))

function generateAgent (position, index, state) {
  if (state.policies[index] == null) {
    // Deep Q-Learning with a neural net function approximation;
    // for gridworld a convnet could be more efficient, but not supported in reinforcejs; should switch to tensorflow-js later
    var spec = { alpha: 0.03, epsilon: 0.4, num_hidden_units: 100 }
    state.policies[index] = new RL.DQNAgent(RLEnv, spec)
  }

  const beliefs = {
    ...Belief('neighborStates', determineNeighborStates(position, state.fields)),
    ...Belief('position', position),
    ...Belief('health', 100),
    ...Belief('coins', 0),
    ...Belief('policy', state.policies[index]),
    ...Belief('agentId', index)
  }
  return new Agent(
    index,
    beliefs,
    desiresRL,
    plans
  )
}

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
    rewards: Array(numberAgents).fill([]),
    rewardsAcc: Array(numberAgents).fill(0),
    policies: Array(numberAgents).fill(undefined),
    iterations: 0
  }
}

const genRandInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const capitalize = s => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const generatePreferences = health => {
  let preferenceOrder
  if (health > 30) {
    preferenceOrder = ['GetCoins', 'GetCoinsLoseHealth', 'GetHealth', 'Nothing', 'LoseHealth', 'GetHealthLoseCoins', 'LoseCoins']
  } else {
    preferenceOrder = ['GetHealth', 'GetHealthLoseCoins', 'GetCoins', 'Nothing', 'LoseCoins', 'GetCoinsLoseHealth', 'LoseHealth']
  }

  return preferenceOrder
  // return preferenceOrder
}

/*
  For all action sets with index1 between index1 and (including) index2:
    index2 does not increase if index1 does not decrease lower than index2
*/
const isEnvyFree = (
  preferences0,
  preferences1,
  index0,
  index1
) => preferences0.every((preference0, index) => {
  if (index < index1 && index >= index0) {
    if (preferences1.indexOf(preference0) > index1) {
      return false
    }
  }
  return true
})

const determineFairEquilibrium = (preferences0, preferences1) => {
  let bestActionSet
  preferences0.forEach(actionSet => {
    const index0 = preferences0.indexOf(actionSet)
    const index1 = preferences1.indexOf(actionSet)
    if (!bestActionSet && isEnvyFree(preferences0, preferences1, index0, index1)) {
      bestActionSet = { actionSet: [index0, index1] }
    }
    if (
      (bestActionSet) &&
      (index0 >= Object.keys(bestActionSet)[0][0] && index0 >= Object.keys(bestActionSet)[0][0]) && // Pareto improvement
      (isEnvyFree(preferences0, preferences1, index0, index1)) // envy-free
    ) {
      bestActionSet = { actionSet: [index0, index1] }
    }
  })
  return bestActionSet
}

const generateReward = (newPosition) => {
  // const availableProfiles = generateProfiles()
  const preferences0 = arena.agents[0].intentions.preferences
  const preferences1 = arena.agents[1].intentions.preferences
  const fairEquilibrium = determineFairEquilibrium(preferences0, preferences1)
  console.log(`fair equilibrium: ${JSON.stringify(fairEquilibrium)}`)
  const action0 = arena.agents[0].intentions.go
  const action1 = arena.agents[1].intentions.go
  const actualActionCombination = `${action0}${capitalize(action1)}`
  const actualIndices = [
    preferences0.indexOf(actualActionCombination),
    preferences1.indexOf(actualActionCombination)
  ]
  const reward = -Math.abs(
    (actualIndices[0] - fairEquilibrium.actionSet[0]) *
    (actualIndices[1] - fairEquilibrium.actionSet[1])
  )
  console.log(`reward: ${reward}`)
  return reward
}

const generateConsequence = (state, agentId, newPosition) => {
  state.health[agentId] = state.health[agentId] - 1

  switch (state.fields[newPosition]) {
    case 'plain':
      if (state.positions.includes(newPosition)) {
        state.health = state.health.map((healthScore, index) => {
          if (state.positions[index] === newPosition) {
            if (state.health[index] <= 0) {
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
      if (state.health[agentId] < 100) {
        state.health[agentId] = Math.min(state.health[agentId] + 10, 100)
      }
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
  if (agentId === '0') {
    state.latestMove0 = state.fields[newPosition]
  }
  if (agentId === '1') {
    state.rewards[0] = generateReward(state.fields[newPosition])
    state.rewards[1] = generateReward(state.fields[newPosition])
    state.rewardsAcc[0] = state.rewardsAcc[0] + state.rewards[0]
    state.rewardsAcc[1] = state.rewardsAcc[1] + state.rewards[1]

    state.iterations = state.iterations + 1

    if (state.iterations % 100 === 0) {
      console.log(state.iterations, 'steps completed')
    }

    if (state.iterations % 500 === 0) {
      console.log('reset positions')

      for (var i = 0; i < 2; i++) {
        var plainFields = Object.keys(state.fields).filter(
          key => state.fields[key] === 'plain'
        )
        const newPosition = parseInt(plainFields[Math.floor(Math.random() * plainFields.length)])
        state.positions[i] = newPosition
      }
    }
  }

  for (var deadAgentId = 0; deadAgentId < 2; deadAgentId++) {
    if (state.health[deadAgentId] <= 0) {
      const plainFields = Object.keys(state.fields).filter(
        key => state.fields[key] === 'plain'
      )
      const newPosition = parseInt(plainFields[Math.floor(Math.random() * plainFields.length)])
      state.positions[deadAgentId] = newPosition
      state.health[deadAgentId] = 100
      state.coins[deadAgentId] = Math.min(state.coins[deadAgentId] - 20, 0)
    }
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
  partnerCoins: state.coins[1 - agentId],
  partnerHealth: state.health[1 - agentId],
  neighborStates: determineNeighborStates(state.positions[agentId], state.fields),
  fullGridWorld: state.fields, // fully observable,
  positions: state.positions,
  reward: state.rewards[agentId]
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
