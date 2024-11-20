/* eslint semi: 0 */
const deploy = document.getElementById('deploy')
// Called when we get a line of data
function onLine (value, agent) {
  console.log(`Received: ${value}`)
  const state = value.substring(
    value.indexOf('[') + 1,
    value.lastIndexOf(']')
  )
  console.log(state)
  if (value.startsWith('2: ')) {
    const jState = JSON.parse(state)
    const update = {
      door: jState.door,
      doorPrev: jState.doorPrev
    }
    console.log(jState)
    const actions = agent.next(update)
    console.log(actions)
    connection.write(`global.paranoidActions = ${JSON.stringify(actions)};`, () => {})
  }
}

var global = window

// When clicked, connect or disconnect
var connection;
deploy.addEventListener('click', function () {
  const beliefs = {
    door: { locked: true },
    doorPrev: { locked: true }
  }
  global.Plans = [
    Plan(
      function (beliefs) {
        if (!beliefs.door.locked) {
          return { request: 'lock' };
        }
        if (beliefs.door.locked && !beliefs.doorPrev.locked) {
          return { announce: 'Thanks for locking the door!' }
        }
      }
    )
  ];
  const paranoid = new Agent('paranoid', beliefs, 0)

  if (connection) {
    connection.close()
    connection = undefined
  }
  Puck.connect(function (c) {
    if (!c) {
      window.alert('Couldn\'t connect.')
      return
    }
    connection = c
    // Handle the data we get back, and call 'onLine'
    // whenever we get a line
    let buffer = ''
    connection.on('data', data => {
      buffer += data;
      let i = buffer.indexOf('\n')
      while (i >= 0) {
        onLine(buffer.substr(0, i), paranoid)
        buffer = buffer.substr(i + 1)
        i = buffer.indexOf('\n')
      }
    })
    deployScripts()
  })
})

async function deployScripts () {
  const edgeJSsonScript = await getScript('./EdgeJSson.js')
  const roomScript = await getScript('./DistributedRoom.js')
  connection.write('reset();\n', () => {
    // wait a bit to "ensure" reset is done
    setTimeout(() => {
      connection.write(
        `${edgeJSsonScript}\n${roomScript}`,
        () => console.log('Ready...'))
    }, 1500);
  })
}

async function getScript (path) {
  let response = await window.fetch(path)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  } else {
    return response.text()
  }
}
