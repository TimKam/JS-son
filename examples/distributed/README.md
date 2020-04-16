# Distribution Support
JS-son supports the implementation of distributed multi-agent systems.
In this tutorial, we show how to implement the [Jason _room_ example](https://github.com/jason-lang/jason/tree/master/examples/room) with *JS-son*, where one agents runs as web socket client while the two other agents run as part of a MAS server.

You find the scenario description in [another tutorial](https://github.com/TimKam/JS-son#belief-plan-approach) that introduces the example in a centralized context.

Before you start with the actual programming, create new Node.js project and install the dependencies ``js-son-agent`` and ``ws``.

## Environment, Porter, and Paranoid Agent: Central Server
We create the ``index-js`` file to implement the environment, as well as the (centrally running) *porter* and the *paranoid* agents.
First, we import the *JS-son* modules, as well as the ``ws`` web socket library:

```js
const { Belief, Plan, Agent, RemoteAgent, Environment } = require('js-son-agent')
const WebSocket = require('ws')
```

Then, we create the initial beliefs and plans of the local agents:

```js
const beliefs = {
  ...Belief('door', { locked: true }),
  ...Belief('requests', [])
}

// Implement "local" agents
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
```

This allows us to create the local agents:

```js
const porter = new Agent('porter', beliefs, {}, plansPorter)
const paranoid = new Agent('paranoid', beliefs, {}, plansParanoid)
```

Note that the local agents are just the same as if the scenario was fully centralized.
Interaction with the remote agent (client) is handled by the environment.
Also, the environment's initial state and its ``update`` function are agnostic to the fact that one of the agents runs remotely:
```js
const state = {
  door: { locked: true },
  requests: []
}

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

The only aspect we need to customize is the interface from the environment to the *client* agent. 
For this, we first configure the web socket server:

```js
const wss = new WebSocket.Server({ port: 8080 })
```

We manage the actions the remote agent will issue in a global object, which is empty at first:

```js
global.actionRequests = {}
```

Then, we set up the web socket connection listener:
```js
wss.on('connection', ws => {
  console.log('connection initiated')
  // ...
})
```

**Within this listener**, we add the remaining program code.

We implement the interface that is a central mock of our remote agent.
For this, we first need to implement the ``runner`` higher-order function.
Because we need the web socket client to be available in the context of this function, we create a 3rd-order function
``runnerGen``.
The ``runner`` higher-order function provides a context in which the environment's ``run`` function is executed.
Because we implement an asynchronous web socket connection, we need to use a different configuration than *JS-son*'s default 'ticks'-based approach.
In our case, an execution cycle of the environment is triggered when a message of our remote agent arrives:

```js
const runnerGen = ws => run => () => {
  ws.on('message', message => {
    console.log('received: %s', message)
    const jMessage = JSON.parse(message)
    if (jMessage.agentId && jMessage.actions) global.actionRequests[jMessage.agentId] = jMessage.actions
    else console.log('could not process message: %s', message)
    run()
  })
} 
```
**Note:** The implementation of this function needs to be slightly more complex if more than one agent runs remotely.
Then, the environment should--at least in some scenarios--run only after all action requests have been received by all remote agents (excluding agents that time out).

Now, we implement a higher-order function that generates our custom ``next`` function that we will give to our remote agent mock.
The function the generator returns will send the belief update to the remote agent (instead of applying it to a locally running instance):

```js
const nextGen = agentId => function next (beliefs) {
  console.log(`Update beliefs of ${agentId}: ${JSON.stringify(beliefs)}`)
  ws.send(JSON.stringify(beliefs))
  console.log(global.actionRequests[agentId])
  return global.actionRequests[agentId]
}
```

Then, we instantiate the agent mock:

```js
const agentId = 'claustrophobe'
const claustrophobe = new RemoteAgent(agentId, beliefs, nextGen(agentId))
```

Finally, we instantiate the environment and run the multi-agent system:

```js
const environment = new Environment(
  [paranoid, claustrophobe, porter],
  state,
  update,
  state => console.log(state),
  state => state,
  runnerGen(ws)
)
environment.run()
```

## Claustrophobe Agent (Client)
Now, we can implement the remaining agent--the *claustrophobe*--as a client.
We create a new file--``claustrophobe.js`` and import the **JS-son** and web socket modules:

```js
const { Belief, Plan, Agent } = require('js-son-agent')
const WebSocket = require('ws')
```

Then, we implement the agent just as if it was designed to run centrally:

```js
const beliefs = {
  ...Belief('door', { locked: true }),
  ...Belief('requests', [])
}

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

const agentId = 'claustrophobe'
const claustrophobe = new Agent(agentId, beliefs, {}, plansClaustrophobe)
```

To enable the web socket server integration, we instantiate a client and send an initial opening
request to the server, which will trigger the execution of the environment's loop:

```js
const ws = new WebSocket('ws://localhost:8080')

ws.on('open', () => {
  ws.send(JSON.stringify({ agentId, actions: [[]] }))
})
```

Finally, we implement a listener for messages from the server.
The messages contain belief updates for our agent, which we apply by executing the agent's ``next`` function:

```js
ws.on('message', message => {
  console.log(`received belief update ${message}`)
  const jMessage = JSON.parse(message)
  if (jMessage === Object(jMessage)) {
    const actions = claustrophobe.next(jMessage)
    console.log(`issue actions: ${JSON.stringify(actions)}`)
    ws.send(JSON.stringify({ agentId, actions }))
  } else {
    console.log(`belief update invalid: ${jMessage}`)
  }
})
```

## Running the example
To run the example, first start the server with ``node index.js`` and then the client with ``node claustrophobe.js``.
