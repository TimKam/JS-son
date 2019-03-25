/*
This script implements a simple information spread simulation, using JS-son's full
belief-desire-intention-plan approach. We simulate the spread of a single boolean belief among 100
agents. The belief spread is simulated as follows:

* The scenario starts with each agent announcing their beliefs.

* In each iteration, the environment distributes two belief announcements to each agent. Based on
  these beliefs and possibly (depending on the agent type) the past announcements the agent was
  exposed to, each agent announces a new *opinion*, which does not necessarily reflect the
  complexity of their beliefs; The announcement is either ``true`` or ``false``, while the

The agents are of two different agent types (``volatile`` and ``introspective``):

1. Type ``volatile``: Volatile agents only consider their current belief and the latest belief set
   they received from the environment when deciding which belief to announce. Volatile agents are
   "louder", i.e. the environment is more likely to spread beliefs of volatile agents. We
   also add bias to the announcement spread function to favor ``true`` announcements.

2. Type ``introspective``: In contrast to volatile agents, introspective agents consider the past
   five belief sets they have received, when deciding which belief they should announce.
   Introspective agents are "less loud", i.e. the environment is less likely to spread beliefs of
   volatile agents.

The agent type distribution is 50, 50. However, 30 volatile and 20 introspective agents start with
``true`` as their belief, whereas 20 volatile and 30 introspective agents start with ``false`` as
their belief.

---------------

We import the JS-son dependencies:
*/
const {
  Belief,
  Desire,
  Plan,
  Agent,
  Environment
} = require('js-son-agent')

// Then, we create the belief sets the agents start with:
const beliefsTrue = {
  ...Belief('keyBelief', true),
  ...Belief('pastReceivedAnnouncements', [])
}

const beliefsFalse = {
  ...Belief('keyBelief', false),
  ...Belief('pastReceivedAnnouncements', [])
}

/*
Now, we define the desires of the two agent types. Both agents base their announcement desires on
the predominant belief in previous announcements (see the ``determinePredominantBelief`` function).
However, volatile agents only consider the most recent round of announcements, while introspective
agents consider the whole history they have available. If both ``true`` and ``false`` occur equally
often in the considered announcement history, the currently held belief is considered to reach a
decision.
*/

const determinePredominantBelief = beliefs => {
  const announcementsTrue = beliefs.pastReceivedAnnouncements.filter(
    announcement => announcement
  ).length
  const announcementsFalse = beliefs.pastReceivedAnnouncements.filter(
    announcement => !announcement
  ).length
  const predominantBelief = announcementsTrue > announcementsFalse ||
    (announcementsTrue === announcementsFalse && beliefs.keyBelief)
  return predominantBelief
}

const desiresVolatile = {
  ...Desire('announceTrue', beliefs => {
    const pastReceivedAnnouncements = beliefs.pastReceivedAnnouncements.length >= 5
      ? beliefs.pastReceivedAnnouncements.slice(-5)
      : new Array(5).fill(beliefs.keyBelief)
    const recentBeliefs = {
      ...beliefs,
      pastReceivedAnnouncements
    }
    return determinePredominantBelief(recentBeliefs)
  }),
  ...Desire('announceFalse', beliefs => {
    const pastReceivedAnnouncements = beliefs.pastReceivedAnnouncements.length >= 5
      ? beliefs.pastReceivedAnnouncements.slice(-5)
      : new Array(5).fill(beliefs.keyBelief)
    const recentBeliefs = {
      ...beliefs,
      pastReceivedAnnouncements
    }
    return !determinePredominantBelief(recentBeliefs)
  })
}

const desiresIntrospective = {
  ...Desire('announceTrue', beliefs => determinePredominantBelief(beliefs)),
  ...Desire('announceFalse', beliefs => !determinePredominantBelief(beliefs))
}

/*
The agents desires are mutually exclusive. Hence, the agents' intentions merely relay their desires,
which is reflected by the default preference function generator
``(beliefs, desires) => desireKey => desires[desireKey](beliefs)``

The agents' plans are to disseminate the announcement (``true`` or ``false``) as determined by the
desire functions:
*/

const plans = [
  Plan(intentions => intentions.announceTrue, () => [ { announce: true } ]),
  Plan(intentions => intentions.announceFalse, () => [ { announce: false } ])
]

/*
Before we instantiate the agents, we need to create an object for the environment's initial state.
The object will be populated when the agents will be created:
*/
const state = {}

/*
To instantiate the agents according to the scenario specification, we create the following function:
*/

const createAgents = () => {
  const agents = new Array(100).fill({}).map((_, index) => {
    // assign agent types--introspective and volatile--to odd and even numbers, respectively:
    const type = index % 2 === 0 ? 'volatile' : 'introspective'
    const desires = type === 'volatile' ? desiresVolatile : desiresIntrospective
    /* ``true`` as belief: 30 volatile and 20 introspective agents
       ``false`` as belief: 20 volatile and 30 introspective agents:
    */
    const beliefs = (index < 50 && index % 2 === 0) || (index < 40 && index % 2 !== 0) ? beliefsTrue
      : beliefsFalse
    // add agent belief to the environment's state:
    state[`${type}${index}`] = { keyBelief: beliefs.keyBelief }
    // create agent:
    return new Agent(
      `${type}${index}`,
      { ...beliefs, ...Belief('type', type) },
      desires,
      plans
    )
  })
  const numberBeliefsTrue = Object.keys(state).filter(
    agentId => state[agentId].keyBelief
  ).length
  const numberBeliefsFalse = Object.keys(state).filter(
    agentId => !state[agentId].keyBelief
  ).length
  console.log(`True: ${numberBeliefsTrue}; False: ${numberBeliefsFalse}`)
  return agents
}

/*
To define how the environment processes agent actions, we implement the ``updateState`` function.
The function takes an agent's actions, as well as the agent ID and the current state to determine
the environment's state update that is merged into the new state
``state = { ...state, ...stateUpdate }``:
*/
const updateState = (actions, agentId, currentState) => {
  const stateUpdate = {}
  actions.forEach(action => {
    stateUpdate[agentId] = {
      keyBelief: action.find(action => action.announce !== undefined).announce
    }
  })
  return stateUpdate
}

/*
We simulate a partially observable world: via the environment's ``stateFilter`` function, we
determine an array of five belief announcements that should be made available to an agent. As
described in the specification, announcements of volatile agents will be "amplified": i.e. the
function pseudo-randomly picks 3 announcements of volatile agents and 2 announcements of
introspective agents. In addition, we add bias that facilitates ``true`` announcements:
*/
const stateFilter = (state, agentKey, agentBeliefs) => {
  const volatileAnnouncements = []
  const introspectiveAnnouncements = []
  Object.keys(state).forEach(key => {
    if (key.includes('volatile')) {
      volatileAnnouncements.push(state[key].keyBelief)
    } else {
      introspectiveAnnouncements.push(state[key].keyBelief)
    }
  })
  const recentVolatileAnnouncements = volatileAnnouncements.sort(
    () => 0.5 - Math.random()
  ).slice(0, 3)
  const recentIntrospectiveAnnouncements = introspectiveAnnouncements.sort(
    () => 0.5 - Math.random()
  ).slice(0, 2)
  // add some noise
  let noise = Object.keys(state).filter(
    agentId => state[agentId].keyBelief).length < 50 * Math.random() ? [true] : []
  noise = Object.keys(state).filter(agentId => state[agentId].keyBelief).length < 29 * Math.random()
    ? [false] : noise
  // combine announcements
  const pastReceivedAnnouncements =
    recentVolatileAnnouncements.concat(
      recentIntrospectiveAnnouncements, agentBeliefs.pastReceivedAnnouncements, noise
    )
  return { pastReceivedAnnouncements, keyBelief: state[agentKey].keyBelief }
}

/*
The last function we need is ``render()``. In our case, we simply log the number of announcements
of ``true`` and ``false`` to the console:
*/
const render = state => {
  const numberBeliefsTrue = Object.keys(state).filter(
    agentId => state[agentId].keyBelief
  ).length
  const numberBeliefsFalse = Object.keys(state).filter(
    agentId => !state[agentId].keyBelief
  ).length
  console.log(`True: ${numberBeliefsTrue}; False: ${numberBeliefsFalse}`)
}

/* We instantiate the environment with the specified agents, state, update function, render
function, and filter function:
*/
const environment = new Environment(
  createAgents(),
  state,
  updateState,
  render,
  stateFilter
)

// Finally, we run 50 iterations of the scenario:
environment.run(50)
