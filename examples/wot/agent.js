// import JS-son
const { Plan } = require('js-son-agent')
const { thingToAgent, updateThingProperties } = require('js-son-wot')

// eslint-disable-next-line
WoT.produce({
  title: 'robot',
  description: 'A mock of a WoT assembly line robot for packaging and quality control',
  support: 'https://github.com/TimKam/JS-son',
  '@context': [
    'https://www.w3.org/2019/wot/td/v1'
  ],
  properties: {
    scrapRateGoal: {
      type: 'number',
      description: 'Threshold of an acceptable scrap rate (in percent)',
      observable: true,
      readOnly: true
    },
    scrapRate: {
      type: 'number',
      description: 'Overall percentage of items that have been identified as scrap',
      observable: true,
      readOnly: true
    },
    overallPackingSpeed: {
      type: 'number',
      description: 'Overall average packing speed of the robot',
      observable: true,
      readOnly: true
    },
    currentProductionSpeed: {
      type: 'number',
      description: 'Current speed of the production line',
      observable: true,
      readOnly: true
    },
    isAssignedToBrokenLine: {
      type: 'boolean',
      description: 'Is true iff the production line that the robot is assigned to is broken',
      observable: true,
      readOnly: true
    },
    isAssignedToJammedLine: {
      type: 'boolean',
      description: 'Is true iff the production line that the robot is assigned to is jammed, i.e., iff there are too many items on the line',
      observable: true,
      readOnly: true
    },
    isRunning: {
      type: 'boolean',
      description: 'Is true if robot is running/working on a production line',
      observable: true,
      readOnly: true
    },
    packingHistory: {
      type: 'array',
      description: 'Logs for each tick if a new item has been packed (1) are not (1)',
      observable: true,
      readOnly: true
    },
    scrapHistory: {
      type: 'array',
      description: 'Logs for each item a zero if it is not scrapped and a 1 if it is scrapped',
      observable: true,
      readOnly: true
    }
  },
  actions: {
    setScrapRateGoal: {
      description: 'Set the speed of the production line. A speed of 0 means the production line stops.',
      uriVariables: {
        rate: { 'type': 'number', 'minimum': 0, 'maximum': 1 }
      }
    },
    stop: {
      description: 'Stop the robot (in turn, the robot stops the production line it is assigned to)'
    },
    start: {
      description: 'Starts the robot (in turn, the robot starts the production line it is assigned to)'
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

  thing.setActionHandler('setScrapRateGoal', (_, options) => {
    try {
      const scrapRate = options['uriVariables']['scrapRate']
      console.log(`Setting scrap rate goal to ${scrapRate}`)
      if (scrapRate >= 0 && scrapRate <= 1) thing.writeProperty('scrapRate', scrapRate)
    } catch (error) {
      console.error(error)
    }
  })

  // implement assembly line robot agent
  thing.writeProperty('isRunning', true)
  thing.writeProperty('scrapRateGoal', 0.025)
  thing.writeProperty('scrapRate', 0)
  thing.writeProperty('currentProductionSpeed', 0)
  thing.writeProperty('overallPackingSpeed', 0)
  thing.writeProperty('isAssignedToBrokenLine', false)
  thing.writeProperty('isAssignedToJammedLine', false)
  thing.writeProperty('packingHistory', [])
  thing.writeProperty('scrapHistory', [])

  const plans = [
    Plan(
      () => true,
      // updated thing properties and manage beliefs
      function (beliefs) {
        console.log({
          itemsOnLine: beliefs.itemsOnLine,
          speed: beliefs.currentProductionSpeed,
          overallPackagingSpeed: beliefs.overallPackingSpeed,
          scrapRate: beliefs.scrapRate
        })
        this.beliefs.packingHistory.push(0)
        this.beliefs.scrapHistory.push(0)
        this.beliefs.overallPackingSpeed =
          beliefs.packingHistory.reduce((a, b) => a + b) / beliefs.packingHistory.length
        this.beliefs.scrapRate =
          beliefs.scrapHistory.reduce((a, b) => a + b) / beliefs.scrapHistory.length
        updateThingProperties(
          this.beliefs.thing,
          this.beliefs,
          [
            'currentProductionSpeed',
            'isAssignedToBrokenLine',
            'isAssignedToJammedLine',
            'overallPackingSpeed',
            'scrapRate'
          ]
        )
      }
    ),
    Plan(
      beliefs => (
        beliefs.isAssignedToJammedLine || beliefs.isAssignedToBrokenLine || !beliefs.isRunning
      ) && beliefs.currentProductionSpeed > 0,
      // stop production line
      beliefs => beliefs.productionLine.invokeAction(
        'setSpeed',
        undefined,
        { uriVariables: { 'speed': 0 } }
      )
    ),
    Plan(
      beliefs => beliefs.isRunning && beliefs.itemsOnLine > 0,
      // pick up item
      function (beliefs) {
        beliefs.productionLine.invokeAction(
          'pickUpItem'
        ).then(item => {
          if (item.content) {
            this.beliefs.packingHistory.pop()
            this.beliefs.packingHistory.push(1)
          }
          if (item.scrap) {
            this.beliefs.scrapHistory.pop()
            this.beliefs.scrapHistory.push(1)
          }
        })
      }
    ),
    Plan(
      beliefs => (
        !(beliefs.isAssignedToJammedLine || beliefs.isRunning) &&
        (beliefs.scrapRate > beliefs.scrapRateGoal && beliefs.currentProductionSpeed > 1)
      ) && beliefs.currentProductionSpeed > 0,
      // slow down production line
      beliefs => beliefs.productionLine.invokeAction(
        'setSpeed',
        undefined,
        { uriVariables: { 'speed': --beliefs.currentProductionSpeed } }
      )
    ),
    Plan(
      beliefs => !(beliefs.isAssignedToJammedLine || beliefs.isAssignedToBrokenLine) &&
        beliefs.scrapRate < beliefs.scrapRateGoal && beliefs.currentProductionSpeed < 10,
      // speed up production line
      beliefs => beliefs.productionLine.invokeAction(
        'setSpeed',
        undefined,
        { uriVariables: { speed: ++beliefs.currentProductionSpeed } }
      )
    )
  ]

  const robot = thingToAgent(thing, plans)
  thing.expose().then(() => console.info(`${thing.getThingDescription().title} ready`))
  setInterval(() => {
    // eslint-disable-next-line
    WoTHelpers.fetch('http://localhost:8080/production_line').then(async (td) => {
      // eslint-disable-next-line
      let productionLine = await WoT.consume(td)
      const itemsOnLine = await productionLine.readProperty('itemsOnLine')
      const currentProductionSpeed = await productionLine.readProperty('speed')
      console.log(currentProductionSpeed)
      const isAssignedToBrokenLine = await productionLine.readProperty('isBroken')
      const isAssignedToJammedLine = await productionLine.readProperty('isJammed')
      robot.next({
        thing,
        productionLine,
        itemsOnLine,
        currentProductionSpeed,
        isAssignedToBrokenLine,
        isAssignedToJammedLine
      })
    })
  }, 1000)
})
