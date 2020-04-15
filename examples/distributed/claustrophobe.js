// import JS-son
const { Belief, Plan, Agent } = require('js-son-agent')
const WebSocket = require('ws') // import web socket library

// implement claustrophobe agent
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

/* implement web socket client that listens for belief updates and issues actions to a remote
environment */
const ws = new WebSocket('ws://localhost:8080')

ws.on('open', () => {
  ws.send(JSON.stringify({ agentId, actions: [[]] }))
})

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
