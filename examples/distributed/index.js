/*
Import js-son and assign Belief, Plan, Agent, RemoteAgent, and Environment to separate consts for the sake of
convenience:
*/
const { Belief, Plan, Agent, RemoteAgent, Environment } = require('js-son-agent')

const WebSocket = require('ws') // import web socket library

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

const porter = new Agent('porter', beliefs, {}, plansPorter)
const paranoid = new Agent('paranoid', beliefs, {}, plansParanoid)

// Configure environment
const state = {
  door: { locked: true },
  requests: []
}

const update = (actions, agentId, currentState) => {
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

/* implement web socket server that listens for action requests of agents */
const wss = new WebSocket.Server({ port: 8080 })

// Configure interface to remote agent
global.actionRequests = {}

wss.on('connection', ws => {
  console.log('connection initiated')
  const nextGen = agentId => function next (beliefs) {
    console.log(`Update beliefs of ${agentId}: ${JSON.stringify(beliefs)}`)
    ws.send(JSON.stringify(beliefs))
    console.log(global.actionRequests[agentId])
    return global.actionRequests[agentId]
  }
  const runnerGen = ws => run => () => {
    ws.on('message', message => {
      console.log('received: %s', message)
      const jMessage = JSON.parse(message)
      if (jMessage.agentId && jMessage.actions) global.actionRequests[jMessage.agentId] = jMessage.actions
      else console.log('could not process message: %s', message)
      run()
    })
  }

  // create remote agent interface
  const agentId = 'claustrophobe'
  const claustrophobe = new RemoteAgent(agentId, beliefs, nextGen(agentId))

  // instantiate and run environment
  const environment = new Environment(
    [paranoid, claustrophobe, porter],
    state,
    update,
    state => console.log(state),
    state => state,
    runnerGen(ws)
  )
  environment.run()
  // ws.send('something')
})
