// import dependencies
const process = require('process')
const { Plan } = require('js-son-agent')
const { thingToAgent, updateThingProperties } = require('js-son-wot')
const { start, assemble } = require('robot-interface')

// configure robot API
const { url, user } = require('config')

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

  // implement assembly line robot agent
  thing.writeProperty('isRunning', true)
  thing.writeProperty('speed', 1)
  thing.writeProperty('queue', [])
  thing.writeProperty('assemblyHistory', [])

  const plans = [
    Plan(
      () => true,
      // updated thing properties and manage beliefs
      function () {
        updateThingProperties(
          this.beliefs.thing,
          this.beliefs,
          [
            'isRunning',
            'speed',
            'queue',
            'assemblyHistory'
          ]
        )
        if (!this.beliefs.hasStarted) {
          start(url, user).then(() => {
            this.beliefs.idle = true
            this.beliefs.hasStarted = true
          })
        }
      }
    ),
    Plan(
      beliefs => beliefs.isRunning && beliefs.queue.length > 0 && beliefs.idle,
      // assemble next item in queue and remove item from queue
      function () {
        const item = this.beliefs.queue.shift()
        const configuration = item.configuration
        assemble(configuration, 3000 / this.beliefs.speed).then(
          function () {
            this.beliefs.idle = true
            this.beliefs.assemblyHistory.push(item)
          }.bind(this)
        )
      }
    )
    // TODO: set speed based on temperature
  ]

  const robot = thingToAgent(thing, plans)
  thing.expose().then(() => console.info(`${thing.getThingDescription().title} ready`))
  setInterval(() => {
    robot.next({
      thing
    })
  }, 1000)
})
