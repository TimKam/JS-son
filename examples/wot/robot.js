// import dependencies
const { Plan } = require('js-son-agent')
const { thingToAgent, updateThingProperties } = require('js-son-wot')
const { start, assemble } = require('robot-interface')

// configure robot API
const { robotUrl, user, gatewayUrl } = require('config')

// eslint-disable-next-line
WoT.produce({
  title: 'robot',
  description: 'An industry scale robot for packing and assembly',
  support: 'https://github.com/TimKam/JS-son',
  '@context': [
    'https://www.w3.org/2019/wot/td/v1'
  ],
  properties: {
    queue: {
      type: 'array',
      description: 'Current queue of assembly orders that the robot needs to work through',
      observable: true,
      readOnly: true
    },
    isAgent: {
      type: 'boolean',
      description: 'Marks the "thing" as an agent',
      observable: true,
      readOnly: true
    },
    speed: {
      type: 'number',
      description: 'Current speed of the robot',
      observable: true,
      readOnly: true
    },
    isRunning: {
      type: 'boolean',
      description: 'Is true if robot is running/working on a production line',
      observable: true,
      readOnly: true
    },
    assemblyHistory: {
      type: 'array',
      description: 'Keeps track of the robot\'s assembly history',
      observable: true,
      readOnly: true
    }
  },
  actions: {
    addToQueue: {
      description: 'Adds a product assembly order to the queue',
      uriVariables: {
        configuration: { 'type': 'string' },
        id: { 'type': 'string' }
      }
    },
    purgeQueue: {
      description: 'Deletes all items from the queue'
    },
    setSpeed: {
      description: 'Sets the assembly speed of the robot'
    },
    stop: {
      description: 'Stops the robot'
    },
    start: {
      description: 'Starts the robot'
    }
  }
}).then(thing => {
  // standard action handlers
  thing.setActionHandler('stop', () => {
    thing.writeProperty('isRunning', false)
  })

  thing.setActionHandler('start', () => {
    thing.writeProperty('isRunning', true)
  })

  thing.setActionHandler('addToQueue', (_, options) => {
    try {
      const configuration = options['uriVariables']['configuration']
      const id = `${options['uriVariables']['id']}-${new Date()}`
      console.log(`Adding item to queue: id: ${id}-${id}, configuration: ${configuration}`)
      thing.readProperty('queue').then(queue => {
        queue.push({ configuration, id })
        thing.writeProperty('queue', queue)
      })
    } catch (error) {
      console.error(error)
    }
  })

  thing.setActionHandler('setSpeed', (_, options) => {
    try {
      thing.writeProperty('setSpeed', options['uriVariables']['speed'])
    } catch (error) {
      console.error(error)
    }
  })

  thing.setActionHandler('purgeQueue', () => {
    try {
      thing.writeProperty('queue', [])
    } catch (error) {
      console.error(error)
    }
  })

  // implement assembly robot agent
  thing.writeProperty('isRunning', true)
  thing.writeProperty('speed', 1)
  thing.writeProperty('queue', [])
  thing.writeProperty('assemblyHistory', [])

  const reviseBeliefs = (oldBeliefs, newBeliefs) => {
    const beliefs = {
      ...oldBeliefs,
      ...newBeliefs
    }
    // updated thing properties and manage beliefs
    updateThingProperties(
      beliefs.thing,
      beliefs,
      [
        'speed',
        'assemblyHistory'
      ]
    )
    // Start robot if necessary
    if (!beliefs.hasStarted) {
      start(robotUrl, user).then(() => {
        beliefs.isIdle = true
        beliefs.hasStarted = true
      })
    }
    // Get thermometer measurements and update beliefs accordingly
    try {
      // eslint-disable-next-line
      WoTHelpers.fetch(`${gatewayUrl}/thermometer`).then(async (td) => {
        // eslint-disable-next-line
        const thermometer = await WoT.consume(td)
        const temperature = await thermometer.readProperty('temperature')
        beliefs.temperature = temperature
      })
    } catch (error) {
      console.log('Thermometer measurements not available')
    }
    // Get assembly trigger updates and update beliefs accordingly
    try {
      // eslint-disable-next-line
      WoTHelpers.fetch(`${gatewayUrl}/action_sensor_a`).then(async (td) => {
        // eslint-disable-next-line
        const sensorA = await WoT.consume(td)
        const sensorAHistory = await sensorA.readProperty('history')
        const newItems = sensorAHistory.filter(itemX =>
          !beliefs.assemblyHistory.some(itemY => itemX.id === itemY.id))
        beliefs.thing.readProperty('queue').then(queue => {
          const updatedQueue = queue.concat(newItems)
          beliefs.queue = updatedQueue
        })
      })
    } catch (error) {
      console.log('action_sensor_a not available')
    }
    try {
      // eslint-disable-next-line
        WoTHelpers.fetch(`${gatewayUrl}/action_sensor_b`).then(async (td) => {
        // eslint-disable-next-line
        const sensorB = await WoT.consume(td)
        const sensorBHistory = await sensorB.readProperty('history')
        const newItems = sensorBHistory.filter(itemX =>
          !beliefs.assemblyHistory.some(itemY => itemX.id === itemY.id))
        beliefs.thing.readProperty('queue').then(queue => {
          const updatedQueue = queue.concat(newItems)
          beliefs.queue = updatedQueue
        })
      })
    } catch (error) {
      console.log('action_sensor_b not available')
    }
    return beliefs
  }
  const plans = [
    Plan(
      beliefs => beliefs.isRunning && beliefs.queue.length > 0 && beliefs.isIdle,
      // assemble next item in queue and remove item from queue
      function () {
        const item = this.beliefs.queue.shift()
        const configuration = item.configuration
        assemble(configuration, 5000 / this.beliefs.speed).then(
          function () {
            this.beliefs.isIdle = true
            this.beliefs.assemblyHistory.push(item)
            this.beliefs.thing.writeProperty('queue', this.beliefs.queue)
          }.bind(this)
        )
      }
    ),
    Plan(
      beliefs => beliefs.isRunning && beliefs.temperature && beliefs.temperature < 60,
      // Set speed to normal
      function () {
        this.beliefs.speed = 1
      }
    ),
    Plan(
      beliefs => beliefs.isRunning && beliefs.temperature && beliefs.temperature > 60,
      // Slow down or stop robot
      function () {
        const temperatureExcessDelta = this.beliefs.temperature - 60
        if (temperatureExcessDelta > 20) {
          this.beliefs.isRunning = false
        } else {
          this.beliefs.speed = 1 - (temperatureExcessDelta / 100) * 4
        }
      }
    )
  ]

  const robot = thingToAgent(thing, plans, reviseBeliefs)
  thing.expose().then(() => console.info(`${thing.getThingDescription().title} ready`))
  setInterval(() => {
    robot.next({
      thing
    })
  }, 1000)
})
