/*
Paranoid agent

Import JS-son
*/
const { Belief, Plan, Agent } = require('js-son-agent')

/* Specify agent beliefs and plans */
const beliefs = {
  ...Belief('door', { locked: true }),
  ...Belief('requests', [])
}

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
Set up and run web socket server
*/
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })
wss.on('connection', ws => {
  ws.on('environment-request', message => {
    console.log('received: %s', message)
  })
  ws.send('something')
})
