# JS-son - a Lean, Extensible JavaScript Agent Programming Library

[![ ](https://circleci.com/gh/TimKam/JS-son.svg?style=svg)](https://circleci.com/gh/TimKam/JS-son)
[![ ](https://readthedocs.org/projects/js-son/badge/?version=latest)](https://js-son.readthedocs.io/en/latest/?badge=latest)

``JS-son`` is a lean and extensible JavaScript library for programming agents.
It has a focus on reasoning loops (agent-internals), and supports the belief-desire-intention approach, among others.
Install it with:

```
npm install js-son-agent
```

## Belief-Desire-Intention (BDI) Agents
*JS-son* follows the belief-desire-intention(-plan) (BDI) approach; a popular model for developing intelligent agents.
However, it is also possible to implement agents that follow simpler reasoning-loop approaches.
For example, in its simplest form, *JS-son* agents can follow a *belief-plan* approach, that means based on their perception of their environment and their own internal state, the execution of plans--which act on the environment and update the agent's own beliefs--is determined.

In this section, we explain how *JS-son* agents make use of the BDI (and plan) concepts and how the *Environment* object type processes agent actions.
For detailed documentation of the corresponding *JS-son* object types and functions, generate the JSDoc (see below).

**Agent**:

* **Beliefs**: Beliefs specify what the agent beliefs about the state of its environment, as well as about is own state. Each belief has a unique ID.

* **Desires**: In *JS-son* desires are functions (each with a unique ID) that determine, based on the agent's beliefs, what the agents *desires* to realize, that means what it would *ideally see realized*.

* **Intentions**: Intentions specify which desires an agent intends to realize, that means what it *in fact wants to work towards realizing*. An agent needs to specify a preference function that derives intentions from desires.

* **Plans**: A plan consists of a *head* and a *body*. The head specifies the intent that needs to be active (be ``true`` or have any other specified value) for the plan to be executed. The *body* determines who the agent fulfills the desire by changing specific beliefs and "executing" actions (i.e., handing over actions to the environment).

*JS-son* also supports a simpler belief-plan model: i.e., in a plan's head, it is possible to specify a function that determines whether a plan should be executed based on the agent's current beliefs.

**Environment**:

The environment provides the agents' "perceptors" with belief updates and processes the agents' actions to determine the actions' impact on the environment's state.


## Requirements & Installation
Installing *JS-son* requires [npm](https://nodejs.org/) or [yarn](https://yarnpkg.com).

To install *JS-son*, run:

```
npm install js-son-agent
```

or:

```
yarn add js-son-agent
```

## Dependencies
*JS-son* does not have any dependencies! This means you can require it in your application without worrying about bloat or unstable/insecure upstream modules.
Only when you want to work on the *JS-son* code base, you should install some *dev dependencies* for linting an testing.

## Tutorials
To illustrate how *JS-son* works, we first present two basic tutorials.
In the first one, we use the simplified belief-plan approach; the second tutorial presents the full belief-desire-intention-plan approach.
You find the source code of these tutorials at [https://github.com/TimKam/JS-son/tree/master/examples/node](https://github.com/TimKam/JS-son/tree/master/examples/node).
In addition, we provide a set of advanced tutorials that show how *JS-son* can be applied in different contexts: in web apps, Jupyter notebooks, grid worlds, and *serverless* (Function-as-a-Service) environments.

### Belief-Plan Approach
In this tutorial, we use basic belief-plan approach to implement the [Jason _room_ example](https://github.com/jason-lang/jason/tree/master/examples/room) with *JS-son*.

In the example, three agents are in a room:

1. A porter, that locks and unlocks the room's door if requested.

2. A paranoid agent, that prefers the door to be locked and asks the porter to lock the door if this
   is not the case.

3. A claustrophobe agent, that prefers the door to be unlocked and asks the porter to unlock the
   door if this is not the case.

The simulation runs twenty iterations of the scenario. In an iteration, each agent acts once.

First, we import *JS-son* and assign Belief, Plan, Agent, and Environment to separate ``consts`` for the sake of convenience:

```JavaScript
const JSson = require('js-son-agent')

const Belief = JSson.Belief
const Plan = JSson.Plan
const Agent = JSson.Agent
const Environment = JSson.Environment
```

All agents start with the same belief set.
The belief with the ID ``door`` is assigned the object ``{ locked: true}``.
I.e., the door is locked.
Also, nobody has so far requested any change in door state (``requests: []``).

```JavaScript
const beliefs = {
  ...Belief('door', { locked: true }),
  ...Belief('requests', [])
}
```

First, we define the porter agent.
The porter has the following plans:

1. If it does not believe the door is locked and it has received a request to lock the door (head), lock the door (body).

2. If it believes the door is locked and it has received a request to unlock the door (head), unlock the door (body).

```JavaScript
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
```

Note that an agent can update its own beliefs (and also plans or any other property it has) in a **body** of its plans (not in a plan's *head*).
For this, simply re-assign the corresponding property, for example as follows:

```JavaScript
Plan(
    beliefs => beliefs.door.locked && beliefs.requests.includes('unlock'),
    function () {
      this.beliefs.door.locked = false
      return [{ door: 'unlock' }]
    }
  )
```
Note that it is necessary to use the ``function`` keyword so that *JS-son* can set the scope of the plan body correctly.
The feature can be deactivated for an agent by instantiating it with the ``selfUpdatesPossible`` parameter set to ``false``.

We instantiate a new agent with the belief set and plans.
Because we are not making use of  *desires* in this simple belief-plan scenario, we pass an empty object as the agent's desires:

```JavaScript
const porter = new Agent('porter', beliefs, {}, plansPorter)
```

Note that alternatively, we can use a single configuration object to instantiate the agent:

```JavaScript
const porter = new Agent({
  id: 'porter',
  beliefs,
  plans: plansPorter
})
```

Next, we create the paranoid agent with the following plans:

1. If it does not belief the door is locked (head), it requests the door to be locked (body).

2. If it beliefs the door is locked (head), it broadcasts a thank you message for locking the door (body).

```JavaScript
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
```

The last agent we create is the *paranoid* one.
It has these plans:

1. If it beliefs the door the door is locked (head), it requests the door to be unlocked (body).

2. If it does not belief the door is locked (head), it broadcasts a thank you message for unlocking the door (body).

```JavaScript
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
```

Now, as we have the agents defined, we need to specify the environment.
First, we set the environments state, which is--in our case--consistent with the agents' beliefs:

```JavaScript
const state = {
  door: { locked: true },
  requests: []
}
```

To define how the environment processes agent actions, we implement the ``updateState`` function.
The function takes an agent's actions, as well as the agent ID and the current state to determine the environment's state update that is merged into the new state ``state = { ...state, ...stateUpdate }``.

```JavaScript
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
```

To simulate a partially observable world, we can specify the environment's ``stateFilter`` function, which determines how the state update should be shared with the agents.
However, in our case we simply communicate the whole state update to all agents, which is also the default behavior of the environment, if no ``stateFilter`` function is specified.

```JavaScript
const stateFilter = state => state
```

We instantiate the environment with the specified agents, state, update function, and filter function:

```JavaScript
const environment = new Environment(
  [paranoid, claustrophobe, porter],
  state,
  updateState,
  stateFilter
)
```

Finally, we run 20 iterations of the scenario:

```JavaScript
environment.run(20)
```

### Goal-based Approach
JS-son supports an alternative goal-based reasoning loop. Here, we show a minimal working example of an agent that employs this approach.
Our agent has merely one goal:

```JavaScript
const goals = {
  praiseDog: Goal('praiseDog', false, { dogName: 'Hasso' })
}
```

The goal has the ID ``praiseDog``, is ``false`` (when starting) and has a ``value`` object with the property ``dogname``, which is ``Hasso``.
The agent starts with the belief that Hasso has not been a nice dog:

```JavaScript
const beliefs = {
  ...Belief('dogNice', false)
}
```

The agent's *goal revision function*  takes the agent's current beliefs and goals and returns a revised goal object (that can feature new goals, revised goals, and/or have previously existing goals removed):

```JavaScript
const reviseGoals = (beliefs, goals) => {
  if (beliefs.dogNice) {
    goals.praiseDog.isActive = true
  }
  return goals
}
```

Our agent has only one plan, which is attached to the ``praiseDog`` goal, *i.e.*, if the goal is active, the plan's *body* function is executed (the agent praises the dog):

```JavaScript
const plans = [ Plan(goals.praiseDog, (beliefs, goalValue) => ({ action: `Good dog, ${goalValue.dogName}!` })) ]
```
Note that the value of a plan's goal can be accessed in the body of the plan.
Based on the goals, beliefs, goal revision function, and plans, we instantiate the agent:

```JavaScript
const newAgent = new Agent({
  id: 'MyAgent',
  beliefs,
  goals,
  plans,
  reviseGoals
})
```

Finally, we run the agent's reasoning loop for one iteration, and provide an updated belief update the dog's niceness:

```JavaScript
newAgent.next({ ...Belief('dogNice', true) }
```
Note that this activates the ``praiseDog`` goal and hence triggers the execution of the agent's only plan.

### Belief-Desire-Intention-Plan Approach
In this tutorial, we implement a simple information spread simulation, using JS-son's full belief-desire-intention-plan approach.
We simulate the spread of a single boolean belief among 100 agents.
The belief spread is simulated as follows:

* The scenario starts with each agent announcing their beliefs.

* In each iteration, the environment distributes two belief announcements to each agent. Based on these beliefs and possibly (depending on the agent type) the past announcements the agent was exposed to, each agent *announces* a new belief: either ``true`` or ``false``.

The agents are of two different agent types (``volatile`` and ``introspective``):

1. Type ``volatile``: Volatile agents only consider their current belief and the latest belief set they received from the environment when deciding which belief to announce. Volatile agents are "louder", i.e. the environment is more likely to spread beliefs of volatile agents. We also add bias to the announcement spread function to favor ``true`` announcements.

2. Type ``introspective``: In contrast to volatile agents, introspective agents consider the past five belief sets they have received, when deciding which belief they should announce. Introspective agents are "less loud", i.e. the environment is less likely to spread beliefs of volatile agents.

The agent type distribution is 50, 50.
However, 30 volatile and 20 introspective agents start with ``true`` as their belief, whereas 20 volatile and 30 introspective agents start with ``false`` as
their belief.


First, we import the JS-son dependencies:

```JavaScript
const {
  Belief,
  Desire,
  Intentions, // eslint-disable-line no-unused-vars
  Plan,
  Agent,
  Environment
} = require('js-son-agent')
```

Then, we create the belief sets the agents start with:

```JavaScript
const beliefsTrue = {
  ...Belief('keyBelief', true),
  ...Belief('pastReceivedAnnouncements', [])
}

const beliefsFalse = {
  ...Belief('keyBelief', false),
  ...Belief('pastReceivedAnnouncements', [])
}
```

Now, we define the desires of the two agent types.
Both agents base their announcement desires on the predominant belief in previous announcements (see the ``determinePredominantBelief`` function).
However, volatile agents only consider the most recent round of announcements, while introspective agents consider the whole history they have available.
If both ``true`` and ``false`` occur equally often in the considered announcement history, the currently held belief is considered to reach a decision:

```JavaScript
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
```

The agents desires are mutually exclusive.
Hence, the agents' intentions merely relay their desires, which is reflected by the default preference function generator.

The agents' plans are to disseminate the announcement (``true`` or ``false``) as determined by the desire functions:

```JavaScript
const plans = [
  Plan(intentions => intentions.announceTrue, () => [ { announce: true } ]),
  Plan(intentions => intentions.announceFalse, () => [ { announce: false } ])
]
```

Before we instantiate the agents, we need to create an object for the environment's initial state.
The object will be populated when the agents will be created:

```JavaScript
const state = {}
```

To instantiate the agents according to the scenario specification, we create the following function:

```JavaScript
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
```

To define how the environment processes agent actions, we implement the ``updateState`` function.
The function takes an agent's actions, as well as the agent ID and the current state to determine the environment's state update that is merged into the new state
``state = { ...state, ...stateUpdate }``:

```JavaScript
const updateState = (actions, agentId, currentState) => {
  const stateUpdate = {}
  actions.forEach(action => {
    stateUpdate[agentId] = {
      keyBelief: action.find(action => action.announce !== undefined).announce
    }
  })
  return stateUpdate
}
```

We simulate a partially observable world: via the environment's ``stateFilter`` function, we determine an array of five belief announcements that should be made available to an agent.
As described in the specification, announcements of volatile agents will be "amplified": i.e. the function pseudo-randomly picks 3 announcements of volatile agents and 2 announcements of introspective agents.
In addition, we add bias that facilitates ``true`` announcements:

```JavaScript
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
  let noise = Object.keys(state).filter(agentId => state[agentId].keyBelief).length < 50 * Math.random() ? [true] : []
  noise = Object.keys(state).filter(agentId => state[agentId].keyBelief).length < 29 * Math.random() ? [false] : noise
  // combine announcements
  const pastReceivedAnnouncements =
    recentVolatileAnnouncements.concat(
      recentIntrospectiveAnnouncements, agentBeliefs.pastReceivedAnnouncements, noise
    )
  return { pastReceivedAnnouncements, keyBelief: state[agentKey].keyBelief }
}
```

The last function we need is ``render()``.
In our case, we simply log the number of announcements of ``true`` and ``false`` to the console:

```JavaScript
const render = state => {
  const numberBeliefsTrue = Object.keys(state).filter(
    agentId => state[agentId].keyBelief
  ).length
  const numberBeliefsFalse = Object.keys(state).filter(
    agentId => !state[agentId].keyBelief
  ).length
  console.log(`True: ${numberBeliefsTrue}; False: ${numberBeliefsFalse}`)
}
```

We instantiate the environment with the specified agents, state, update function, render function, and filter function:

```JavaScript
const environment = new Environment(
  createAgents(),
  state,
  updateState,
  render,
  stateFilter
)
```

Finally, we run 50 iterations of the scenario:

```JavaScript
environment.run(50)
```

## Belief Revision
By default, JS-son agents get their belief update from the environment and revise their existing
beliefs as follows:

```JavaScript
beliefs = {
  ...oldBeliefs,
  ...newBeliefs
}
```
Here, ``oldBeliefs`` are the agent's existing beliefs, whereas ``newBeliefs`` are the belief updates the agent receives; *i.e.*, the agent always accepts the belief update.
However, JS-son supports the implementation of a custom belief revision function that allows agents to (partially or fully) reject belief updates received from their environment, to post-process beliefs in any other manner, or to acquire additional beliefs on their own.
For example, let us implement the following simple agent:

```JavaScript
let agent = new Agent('myAgent', { ...Belief('a', true) }, {}, [])
```

Now, let us run the agent so that the environment changes the agent's belief about ``a``.

```JavaScript
agent.next({ ...Belief('a', false) })
```

``agent.beliefs.a`` is ``false``.

We can implement a custom belief revision function that guarantees that the belief about ``a`` must not be overwritten:

```JavaScript
const (oldBeliefs, newBeliefs) => ({
  ...oldBeliefs,
  ...newBeliefs,
  a: true
})
let agent = new Agent('myAgent', { ...Belief('a', true) }, {}, [], undefined, false, reviseBeliefs)
```

To test the change, proceed as follows:

```JavaScript
agent.next({ ...Belief('a', false) })
```

``agent.beliefs.a`` is ``true``.

## Messaging
JS-son agents can send "private" messages to any other JS-son agent, which the environment will then relay to this agent only.
Agents can send these messages in the same way they register the execution of an action as the result of a plan.
For example, in the plan below, an agent sends the message ``'Hi!'`` to the agent with the ID ``alice``:

```JavaScript
const messagePlans = [
  Plan(_ => true, () => ({ messages: [{ message: 'Hi!', agentId: 'alice' }] }))
]
```

Assuming that the sending agent has the ID ``bob``, the agent ``alice`` will receive the following belief update:

```JavaScript
beliefs = {
  ...beliefs,
  messages: {
    bob: ['Hi!']
  }
}
```

Note that messages do not need to be strings, but can be of any type, for example objects.

## Further Examples

### Data Science
To show how *JS-son* can be used with state-of-the art data science tools, we provide a multi-agent simulation example that runs in a Jupyter notebook and integrates with Python data visualization libraries. The simulation compares belief spread among agents in different environments and is based on the [belief-desire-intention(-plan) tutorial](https://github.com/TimKam/JS-son#belief-desire-intention-plan-approach).

You find the Jupyter notebook in the example folder of the *JS-son* Github repository, as well as [here on Google Colab](https://colab.research.google.com/drive/1_viwoWyOIl8SH61WEAnEpndbR18WHPf3).

**Note**: The interactive widget that is provided as part of the notebook only works with "full"/local Jupyter notebook tools and not on Google Colab, as it requires the [ipywidgets library](https://ipywidgets.readthedocs.io/en/stable/), which Google Colab does not support.

### Web Application
Of course, *JS-son* can also be used in web application development.
To illustrate how, we implemented [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life), using *JS-son*'s belief-plan approach.
We integrated the Game of Life simulation in a [Framework7](https://framework7.io/) application. The web application runs online at [https://people.cs.umu.se/~tkampik/demos/js-son/](https://people.cs.umu.se/~tkampik/demos/js-son/).

You find the the source code of the web application [here in the examples directory](https://github.com/TimKam/JS-son/tree/master/examples/web).
To run the example, install its dependencies with ``npm install`` and run the application in development (hot-reload) mode with ``npm run dev``.

### Grid World
By default, *JS-son* supports grid world environments.
A comprehensive multi-agent grid world tutorial is provided [here in the examples section](https://github.com/TimKam/JS-son/tree/master/examples/arena/README.md).

### Distributed MAS
*JS-son* supports distributed multi-agent systems, where the environment interacts with remotely running agents.
A tutorial on how to implement distributed MAS with *JS-son*, alongside a running example, is available [here](https://github.com/TimKam/JS-son/tree/master/examples/distributed/README.md).

### Serverless
[This tutorial](https://github.com/TimKam/JS-son/tree/master/examples/serverless/README.md) describes how to run JS-son agents as *serverless* Google Cloud Functions.

## Supported Platforms
*JS-son* supports recent versions of Firefox, Chrome, and Node.js.
It is not tested for other platforms and does not use [Babel](https://babeljs.io/) to facilitate compatibility with legacy platforms.
Contributions that change this are welcome!

## Further Content
* [Grid world tutorial](./gridworld.md)
* [Serverless tutorial](./serverless.md)
* [API reference](./api.md)

## Testing
The project uses [Jasime](https://jasmine.github.io/2.0/node.html) for testing.
Run the tests with ``npm test``.
The tests also run on CircleCI.

## Documentation
*JS-son* is documented with [Sphinx](http://www.sphinx-doc.org/en/master/).
Building the documentation requires Python and CMake.
Install the Python dependencies for the documentation with ``pip install -r doc-requirements.txt``.
Generate the documentation by navigating to the ``doc`` directory and running ``make html``.
The documentation will be placed (as HTML files) to ``doc/_build/html``.

## Contributions
We welcome contributions.
Contributors should consider the following conventions:

  * Be nice.

  * Add tests for your code and make sure all tests pass.

  * Add/update JSdoc comments.

  * Ensure ESLint does not show any errors or warnings.

  * Reference relevant issues in commits and branch names.

## Acknowledgements
**Author**: Timotheus Kampik - [@TimKam](https://github.com/TimKam)

**Agent Architecture Co-Designer**: Juan Carlos Nieves

**Cite as**:

```
@InProceedings{10.1007/978-3-030-51417-4_11,
author="Kampik, Timotheus
and Nieves, Juan Carlos",
editor="Dennis, Louise A.
and Bordini, Rafael H.
and Lesp{\'e}rance, Yves",
title="JS-son - A Lean, Extensible JavaScript Agent Programming Library",
booktitle="Engineering Multi-Agent Systems",
year="2020",
publisher="Springer International Publishing",
address="Cham",
pages="215--234",
isbn="978-3-030-51417-4"
}
```

This work was partially supported by the Wallenberg AI, Autonomous Systems and Software Program (WASP) funded by the Knut and Alice Wallenberg Foundation.
