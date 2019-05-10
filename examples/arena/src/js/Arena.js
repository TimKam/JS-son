// import js-son and assign Belief, Plan, Agent, GridWorld, and FieldType to separate consts
import { Belief, Desire, Plan, Agent, GridWorld, FieldType } from 'js-son-agent'

var RL = require('./rl.js');

const action_mapping = ['up', 'down', 'left', 'right'];
const field_mapping = {'mountain': 0, 'plain': 1, 'diamond': 2, 'repair': 3};
const RLEnv = {
  getNumStates: function() { return 404; },
  getMaxNumActions: function() { return 4; }
};

/* desires */
const desires_rl = {
  ...Desire('go', beliefs => {

    // before we have not issued any command, there is no reward (only for first iteration)
    if (!Array.isArray(beliefs.reward)) {
      beliefs.policy.learn(beliefs.reward);
    }

    var state_vec = beliefs.fullGridWorld.map(field => field_mapping[field]);
    state_vec[beliefs.positions[0]] = 4;
    state_vec[beliefs.positions[1]] = 5;
    state_vec.push(beliefs.health);
    state_vec.push(beliefs.coins);
    state_vec.push(beliefs.partnerHealth);
    state_vec.push(beliefs.partnerCoins);

    const a = beliefs.policy.act(state_vec);
    return action_mapping[a];
  })
}

const desires_greedy = {
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
const generateAgents = initialState => initialState.positions.map((position, index) => generateAgent(position, index, initialState))

function generateAgent(position, index, state) {
  if (state.policies[index] == null) {
    // Deep Q-Learning with a neural net function approximation;
    // for gridworld a convnet could be more efficient, but not supported in reinforcejs; should switch to tensorflow-js later
    var spec = { alpha: 0.01, epsilon: 0.2, num_hidden_units: 64 } // TODO Exploration scheduling
    state.policies[index] = new RL.DQNAgent(RLEnv, spec);
  }                                    

  const beliefs = {
    ...Belief('neighborStates', determineNeighborStates(position, state)),
    ...Belief('position', position),
    ...Belief('health', 100),
    ...Belief('coins', 0),
    ...Belief('policy', state.policies[index])
  }
  return new Agent(
    index,
    beliefs,
    desires_rl,
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
    rewards_acc: Array(numberAgents).fill(0),
    policies: Array(numberAgents).fill(undefined),
    iterations: 0
  }
}

const genRandInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const generatePreferences = (agentId, availableProfiles) => {
  let genericPreferenceMapping
  if (arena.state[agentId].health > 30) {
    genericPreferenceMapping = [
      'GetCoinsGetHealth',
      'GetCoins',
      'GetCoinsLoseHealth',
      'GetHealth',
      'Nothing',
      'LoseHealth',
      'LoseCoinsGetHealth',
      'LoseCoins',
      'LoseCoinsLoseHealth',
      'Die'
    ]
  } else {
    genericPreferenceMapping = [
      'GetCoinsGetHealth',
      'GetHealth',
      'LoseCoinsGetHealth',
      'GetCoins',
      'Nothing',
      'LoseCoins',
      'GetCoinsLoseHealth',
      'LoseHealth',
      'LoseCoinsLoseHealth',
      'Die'
    ]
  }

  return genericPreferenceMapping.filter(
    consequence =>
      Object.keys(availableProfiles).some(profileConsequence =>
        profileConsequence === consequence
      )
  ).map(consequence => availableProfiles[consequence])
}

const generateReward = (state, agentId, newPosition) => {
  const preferences = generatePreferences()
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
  return ''
}

const generateConsequence = (state, agentId, newPosition) => {
  state.rewards[agentId] = 0
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
        state.rewards[agentId] = -1
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
      state.rewards[agentId] = 1
      break
    case 'repair':
      if (state.health[agentId] < 100) { 
        state.health[agentId] = Math.min(state.health[agentId] + 10, 100)
        state.rewards[agentId] = 1
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
  if (agentId === '1') {
    //state.rewards[0] = generateReward(state, 0, state.fields[newPosition]);
    //state.rewards[1] = generateReward(state, 1, state.fields[newPosition]);

    state.iterations = state.iterations + 1

    if (state.iterations % 100 == 0) {
      console.log(state.iterations, "steps completed");
    }

    if (state.iterations % 500 == 0) {
      console.log("reset positions");

      for (var i = 0; i < 2; i++) {
        var plainFields = Object.keys(state.fields).filter(
          key => state.fields[key] === 'plain'
        )
        var newPosition = plainFields[Math.floor(Math.random()*plainFields.length)];
        state.positions[i] = newPosition;
      }
    }
  }

  for (var deadAgentId = 0; deadAgentId < 2; deadAgentId++) {
    if (state.positions[deadAgentId] == null) {
        var plainFields = Object.keys(state.fields).filter(
          key => state.fields[key] === 'plain'
        )
        var newPosition = plainFields[Math.floor(Math.random()*plainFields.length)];
        state.positions[deadAgentId] = newPosition;
        state.health[deadAgentId] = 100;
        state.coins[deadAgentId] = Math.min(state.coins[deadAgentId] - 20, 0);
    }
  }

  state.rewards_acc[agentId] = state.rewards_acc[agentId] + state.rewards[agentId]

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
  partnerCoins: state.coins[1-agentId],
  partnerHealth: state.health[1-agentId],
  neighborStates: determineNeighborStates(state.positions[agentId], state),
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
