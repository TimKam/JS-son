/* eslint semi: 0 */
const deployPuckA = document.getElementById('deploy-puck-a')
const deployPuckB = document.getElementById('deploy-puck-b')
// Called when we get a line of data
function onLine (value) {
  console.log(`Received: ${value}`)
  if (value.includes('Assembly button a')) {
    requestAssembly('a').then(res => console.log(res))
  } else if (value.includes('Assembly button b')) {
    requestAssembly('b').then(res => console.log(res))
  }
}

var global = window

// When clicked, connect or disconnect
var connection
deployPuckA.addEventListener('click', function () {
  onClick('a')
})
deployPuckB.addEventListener('click', function () {
  onClick('b')
})

function onClick (config) {
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
        onLine(buffer.substr(0, i))
        buffer = buffer.substr(i + 1)
        i = buffer.indexOf('\n')
      }
    })
    deployPuckScripts(config)
  })
}

async function deployPuckScripts (config) {
  const puckScript = await getScript('./puck.js')
  connection.write('reset();\n', () => {
    // wait a bit to "ensure" reset is done
    setTimeout(() => {
      connection.write(
        puckScript.replace('button a', `button ${config}`),
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

async function requestAssembly (config) {
  const response = await fetch(`${gatewayUrl}/action_sensor_${config}/actions/triggerAssembly`, {
    method: 'POST',
    mode: 'cors'
  })
  return response
}
