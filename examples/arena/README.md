# JS-son Arena - A Multi-Agent Grid World

This tutorial describes how to use **JS-son** to implement a simple multi-agent grid world.
The example application is available online at [https://people.cs.umu.se/~tkampik/demos/arena/](https://people.cs.umu.se/~tkampik/demos/arena/).

## Use Case
The tutorial describes the implementation of a 20 x 20 grid world.
In the world, 10 agents are acting.
Besides the agents, different static artifacts exits: *mountains* that block the agents' way, *money* fields, from which the agents can collect coins, and *repair* fields that allow the agents to restore their health.
If agents "crash" into each other, they lose some of their health.

The implemented agents are fairly primitive and follow a set of simple rules when selecting their actions.
This means the tutorial is a good starting point for implementing more powerful agents with complex reasoning, learning, or planning abilities.

## Dependencies
*JS-son Arena* is implemented as a [Framework7](https://framework7.io/) application and additionally uses the [Material Design](https://material.io/tools/icons) icon library.
This means, besides ``js-son-agent``, the application requires the following libraries:

```json
{
    "dom7": "^2.1.3",
    "framework7": "^4.0.1",
    "framework7-icons": "^2.2.0",
    "material-design-icons": "^3.0.1",
    "template7": "^1.4.1"
}
```
However, these libraries are only used as helpers to simplify the setup of a modern JavaScript build environment and to provide some out-of-the-box UI styles.
Generally, *JS-son* grid worlds can be implemented in any JavaScript environment.

## Boiler Plate
As the initial boiler plate, the application uses a stripped-down version of [this Framework7 app generator](https://framework7.io/cli/).

In addition, the ``home.f7.html`` page in the ``src`` directory features the following elements:

* The ``arena-grid`` div will contain the grid world.
* The ``analysis``grid will contain metrics that describe the state of the grid world.
* When clicked, the ``restart-button`` link will trigger a restart of the grid world with a new pseudo-random initial state.

```html
<div id="arena-grid"></div>
<div id="analysis"></div>
<div class="controls">
    <a class="button button-fill restart-button">Restart</a>
</div>
```

The file ``app.js`` in ``src/js`` implements the Framework7-specific JavaScript code of *JS-son Arena*.
First, we import the dependencies:

```javascript
import $$ from 'dom7'
import Framework7 from 'framework7/framework7.esm.bundle.js'
import 'framework7/css/framework7.bundle.css'
import '../css/icons.css'
import '../css/app.css'
import routes from './routes.js'
import Arena from './Arena'
```

Note that we describe the implementation of the ``Arena`` file--the grid world an agent specification--later.

The following code configures the Framework7 app, initializes the grid world, executes a grid world step/turn every two seconds, and implements the restart button functionality: 

```javascript
var app = new Framework7({ // eslint-disable-line no-unused-vars
  root: '#app', // App root element

  name: 'JS-son: Game of Life', // App name
  theme: 'auto', // Automatic theme detection
  // App root data
  data: () => {
    $$(document).on('page:init', e => {
      let arena = Arena()
      let shouldRestart = false
      $$('.restart-button').on('click', () => {
        shouldRestart = true
      })
      window.setInterval(() => {
        if (shouldRestart) {
          shouldRestart = false
          arena = Arena()
        } else {
          arena.run(1)
          console.log(arena)
          $$('#arena-grid').html(arena.render(arena.state))
          $$('#analysis').html(`
            <table>
              <tr>
                <td><strong>Agent</strong></td>
                ${arena.state.positions.map((_, index) => `<td>${index}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Health</strong></td>
                ${arena.state.health.map(healthScore => `<td>${healthScore}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Coins</strong></td>
                ${arena.state.coins.map(coins => `<td>${coins}</td>`).join('')}
              </tr>
            </table>
          `)
        }
      }, 2000)
    })
  },
  // App routes
  routes: routes
})
```

We also need to configure some UI styles that will make the grid work environment look good; you find them in [app.css stylesheet](https://github.com/TimKam/JS-son/blob/master/examples/arena/src/css/app.css).

## Agents and Environment
Now, we can start with the core of the tutorial: implementing *JS-son* agents and environment.
We create a new file--``Arena.js``--in ``src/js`` and import *JS-son* as follows:
```javascript
import { Belief, Desire, Plan, Agent, GridWorld, FieldType } from 'js-son-agent'
```

When used with its full capabilities, *JS-son* is a library for implementing *belief-desire-intention* (BDI) agents:

* An agent starts with a set of *beliefs* (what it thinks is true about the environment).
* From the beliefs the agent generates *desire* functions that what the agent desires to achieve, given the beliefs.
* Still the determined *desires* might be in conflict with each other; this is why another function will determine the desires that should in fact be achieved--the so-called *intentions*.
* The intentions that are active determine the pre-specified *plan* functions that should be executed. A plan determines the agent's internal belief update, as well as a set of actions that should be executed. That means, the actions will be registered at the environment for execution; the environment will determine how the actions will be processed.

Beliefs are static objects.
Because we want to define beliefs dynamically, we will later write a function that creates them.
First, we specify the desire functions.

```javascript
const desires = {
  ...Desire('go', beliefs => {
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
```

From the desires, we jump directly to plans.
The plans simply relay the determined desire to the environment.

```javascript
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
```

In our grid world, the environment communicates only the state of an agents' neighboring fields (*orthogonal* neighbors: left, right, above, below) to the agent.
To implement this behavior, we define the following helper function:
```javascript
const determineNeighborStates = (position, state) => ({
  up: position + 20 >= 400 ? undefined : state.fields[position + 20],
  down: position - 20 < 0 ? undefined : state.fields[position - 20],
  left: position % 20 === 0 ? undefined : state.fields[position - 1],
  right: position % 20 === 1 ? undefined : state.fields[position + 1]
})
```

Then, we implement a function that dynamically generates agents that are aware of their own position and the field types of neighboring fields.
Each agents has a unique position and is otherwise identical with the others in its beliefs, desires, intentions, and plans. 
```javascript
const generateAgents = initialState => initialState.positions.map((position, index) => {
  const beliefs = {
    ...Belief('neighborStates', determineNeighborStates(position, initialState)),
    ...Belief('position', position),
    ...Belief('health', 10),
    ...Belief('coins', 0)
  }
  return new Agent(
    index,
    beliefs,
    desires,
    plans
  )
})
```

Now, we implement the grid world environment.
First, we define a function that generates the environment's pseudo-random initial state.
The function will be called on page load and when clicking the *Restart* button.
```javascript
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
    } else if (rand < 0.25 && positions.length < 10) {
      positions.push(index)
      return 'plain'
    } else {
      return 'plain'
    }
  })
  return {
    dimensions,
    positions,
    coins: Array(10).fill(0),
    health: Array(10).fill(10),
    fields
  }
}
```

Then, we specify the *field types* the environment supports.
When an agent acts on a field of a specific type, a set of *consequences* will be generated that updates the environment's state (which may in turn lead to an update of the state of some or all of the agents).
The functions below translate a specific action into a position change, if applicable (``trigger``) and determine the consequence to the general state of the agent and its environment (``generateConsequence``).
```javascript
// determine the consequence of an agent's action on a specific field
const generateConsequence = (state, agentId, newPosition) => {
  switch (state.fields[newPosition]) {
    case 'plain':
      if (state.positions.includes(newPosition)) {
        state.health = state.health.map((healthScore, index) => {
          if (state.positions[index] === newPosition) {
            if (state.health[index] <= 1) {
              state.positions[index] = undefined
            }
            return --healthScore
          } else {
            return healthScore
          }
        })
        state.health[agentId]--
        if (state.health[agentId] <= 0) {
          state.positions[agentId] = undefined
        }
      } else {
        state.positions[agentId] = newPosition
      }
      break
    case 'diamond':
      state.coins[agentId]++
      break
    case 'repair':
      if (state.health[agentId] < 10) state.health[agentId]++
      break
  }
  return state
}

// trigger an agent's action a specific field
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
```

We implement the following fields:

* **Mountain** fields that the agents cannot pass.

* **Diamond/money** fields that provide one *coin* to an agent that approaches them (the agent needs to move onto the field, but the environment will *return a coin* and leave the agent at its current position).

* **Repair** fields that provide damaged agents with one additional *health* unit when approached (again, the agent needs to move onto the field, but the environment will *return a coin* and leave the agent at its current position).

* **Plain** fields that can be traversed by an agent if no other agent is present on the field. If another agent is already present, the environment will reject the move, but decrease both agents' health by one. 

For each field type, we specify:

  * A unique identifier;

  * A function that determines the field's table cell class based on the environment's ``state`` and the field's ``position`` in the browser-based representation of the grid world;

  * A function that determines the field's table cell class based on the environment's ``state`` and the field's ``position`` in the Node.js/command line representation of the grid world. In this tutorial, we focus on a browser-based UI. Hence, this function is of little interest;

  * A function that generates an *annotation* field's table cell class based on the environment's ``state`` and the field's ``position`` in the browser-based representation of the grid world. In this example, we use the function to generate an annotation of the agent's ID to a field that is occupied by an agent.

  * The trigger function as defined above.

```javascript
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
```

We define the environment's ``stateFilter`` function that updates the agents beliefs by providing the new wealth and health levels and updating the agent's beliefs about the current neighbor states according to the current position.
As the agents are exposed to a *partially observable* environment, they only receive information about fields that are direct (orthogonal) neighbors to their current position:
```javascript
const stateFilter = (state, agentId, agentBeliefs) => ({
  ...agentBeliefs,
  coins: state.coins[agentId],
  health: state.health[agentId],
  neighborStates: determineNeighborStates(state.positions[agentId], state)
})
```

Finally, we create a function that generates a new GridWorld object with the specified properties (including partially pseudo-random initial state) and export it, so that it can be imported by the main application:
```javascript
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
```

## Running the Application
To run the application, execute ``npm run dev`` in the root directory of this example project.
Your browser will automatically open the application, which looks like this:

![JS-son: Arena example](https://raw.githubusercontent.com/TimKam/JS-son/master/examples/arena/js-son-arena.png)

To run the full build to generate files that can be deployed to a website run ``npm run build-prod``.



