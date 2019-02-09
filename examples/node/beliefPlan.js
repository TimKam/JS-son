/*
We import js-son and assign Belief, Plan, Agent, and Environment to sepearate consts for the sake of
convenience:
*/
const JSson = require('js-son')

const Belief = JSson.Belief
const Plan = JSson.Plan
const Agent = JSson.Agent
const Environment = JSson.Environment

/*
Basic example of using the basic belief-plan approach with JSson
JS-son implementation of the Jason _room_ example:
see: https://github.com/jason-lang/jason/tree/master/examples/room

Three agents are in a room:

1. A porter, that locks and unlocks the room's door if requested.

2. A paranoid agent, that prefers the door to be locked and asks the porter to lock the door if this
   is not the case.

3. A claustrophobe agent, that prefers the door to be unlocked and asks the porter to unlock the
   door if this is not the case.

The simulation runs twenty iterations of the scenario. In an iteration, each agent acts once.

All agents start with the same belief set.
The belief with the ID ``door`` is assigned the object ``{ locked: true}``.
I.e., the door is locked.
Also, nobody has so far requested any change in door state (``requests: []``).
*/
const beliefs = {
  ...Belief('door', { locked: true }),
  ...Belief('requests', [])
}

/*
First, we define the porter agent.
The porter has the following plans:

1. If it does not believe the door is locked and it has received a request to lock the door (head),
   lock the door (body).

2. If it believes the door is locked and it has received a request to unlock the door (head),
   unlock the door (body).
*/
const plansPorter = [
  Plan(
    beliefs => !beliefs.door.locked && beliefs.requests.includes('lock'),
    () => [{ door: 'lock' }]
  ),
  Plan(
    beliefs => beliefs.door.locked && beliefs.requests.includes('unlock'),
    () => [{ door: 'unlock' }]
  )
]

/*
We instantiate a new agent with the belief set and plans.
Because we are not making use of  *desires* in this simple belief-plan scenario , we pass an empty
object as the agent's desires:
*/
const porter = new Agent('porter', beliefs, {}, plansPorter)

/*
Next, we create the paranoid agent with the following plans:

1. If it does not belief the door is locked (head),
   it requests the door to be locked (body).

2. If it beliefs the door is locked (head),
   it broadcasts a thank you message for locking the door (body).

*/
const plansParanoid = [
  Plan(
    beliefs => !beliefs.door.locked,
    () => [{ request: 'lock' }]
  ),
  Plan(
    beliefs => beliefs.door.locked,
    () => [{ announce: 'Thanks for locking the door!' }]
  )
]

const paranoid = new Agent('paranoid', beliefs, {}, plansParanoid)

/*
The last agent we create is the *paranoid* one.
It has these plans:

1. If it beliefs the door the door is locked (head),
   it requests the door to be unlocked (body).

2. If it does not belief the door is locked (head),
   it broadcasts a thank you message for unlocking the door (body).

*/
const plansClaustrophobe = [
  Plan(
    beliefs => beliefs.door.locked,
    () => [{ request: 'unlock' }]
  ),
  Plan(
    beliefs => !beliefs.door.locked,
    () => [{ announce: 'Thanks for unlocking the door!' }]
  )
]

const claustrophobe = new Agent('claustrophobe', beliefs, {}, plansClaustrophobe)

/*
Now, as we have the agents defined, we need to specify the environment.
First, we set the environments state, which is--in our case--consistent with the agents' beliefs:
*/
const state = {
  door: { locked: true },
  requests: []
}

/*
To define how the environment processes agent actions, we implement the ``updateState`` function.
The function takes an agent's actions, as well as the agent ID and the current state to determine
the environment's state update that is merged into the new state
``state = { ...state, ...stateUpdate }``.
*/
const updateState = (actions, agentId, currentState) => {
  const stateUpdate = {
    requests: currentState.requests
  }
  actions.forEach(action => {
    if (action.some(action => action.door === 'lock')) {
      stateUpdate.door = { locked: true }
      stateUpdate.requests = []
      console.log(`${agentId}: Lock door`)
    }
    if (action.some(action => action.door === 'unlock')) {
      stateUpdate.door = { locked: false }
      stateUpdate.requests = []
      console.log(`${agentId}: Unlock door`)
    }
    if (action.some(action => action.request === 'lock')) {
      stateUpdate.requests.push('lock')
      console.log(`${agentId}: Request: lock door`)
    }
    if (action.some(action => action.request === 'unlock')) {
      stateUpdate.requests.push('unlock')
      console.log(`${agentId}: Request: unlock door`)
    }
    if (action.some(action => action.announce)) {
      console.log(`${agentId}: ${action.find(action => action.announce).announce}`)
    }
  })
  return stateUpdate
}

/*
To simulate a partially observable world, we can specify the environment's ``stateFilter`` function,
which determines how the state update should be shared with the agents.
However, in our case we simply communicate the whole state update to all agents,
which is also the default behavior of the environment, if no ``stateFilter`` function is specified.
*/
const stateFilter = state => state

/* We instantiate the environment with the specified agents, state, update function, and filter
function:
*/
const environment = new Environment(
  [paranoid, claustrophobe, porter],
  state,
  updateState,
  stateFilter
)

// Finally, we run 20 iterations of the scenario:
environment.run(20)
