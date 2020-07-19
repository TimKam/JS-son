// import JS-son
const { Belief, Plan, Agent } = require('js-son-agent')

// eslint-disable-next-line
WoT.produce({
  title: 'Robot',
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
    }
  },
  actions: {
    setScrapRateGoal: {
      description: 'Set the speed of the production line. A speed of 0 means the production line stops.',
      uriVariables: {
        speed: { 'type': 'integer', 'minimum': 0, 'maximum': 10 }
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
  // implement assembly line robot agent
  const beliefs = {
    ...Belief('isRunning', true),
    ...Belief('scrapRateGoal', 0.025),
    ...Belief('scrapRate', 0),
    ...Belief('currentProductionSpeed', 0),
    ...Belief('overallPackingSpeed', 0),
    ...Belief('isAssignedToBrokenLine', false),
    ...Belief('isAssignedToJammedLine', false),
    ...Belief('packingHistory', []),
    ...Belief('scrapHistory', [])
  }

  const plans = [
    Plan(
      () => true,
      // updated thing properties and manage beliefs
      function (beliefs) {
        console.log({
          itemsOnLine: beliefs.itemsOnLine,
          currentSpeed: beliefs.currentProductionSpeed,
          overallPackagingSpeed: beliefs.overallPackingSpeed,
          scrapRate: beliefs.scrapRate
        })
        beliefs.thing.writeProperty('currentProductionSpeed', beliefs.currentProductionSpeed)
        beliefs.thing.writeProperty('isAssignedToBrokenLine', beliefs.isAssignedToBrokenLine)
        beliefs.thing.writeProperty('isAssignedToJammedLine', beliefs.isAssignedToJammedLine)
        this.beliefs.packingHistory.push(0)
        this.beliefs.scrapHistory.push(0)
        this.beliefs.overallPackingSpeed =
          beliefs.packingHistory.reduce((a, b) => a + b) / beliefs.packingHistory.length
        this.beliefs.scrapRate =
          beliefs.scrapHistory.reduce((a, b) => a + b) / beliefs.scrapHistory.length
        beliefs.thing.writeProperty('overallPackingSpeed', this.beliefs.overallPackingSpeed)
        beliefs.thing.writeProperty('scrapRate', this.beliefs.overallPackingSpeed)
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
        beliefs.isAssignedToJammedLine ||
        !beliefs.isRunning ||
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
      beliefs => (!beliefs.isAssignedToJammedLine || !beliefs.isAssignedToBrokenLine) &&
        beliefs.scrapRate < beliefs.scrapRateGoal && beliefs.currentProductionSpeed < 10,
      // speed up production line
      beliefs => beliefs.productionLine.invokeAction(
        'setSpeed',
        undefined,
        { uriVariables: { speed: ++beliefs.currentProductionSpeed } }
      )
    )
  ]

  const agentId = 'robot'
  const robot = new Agent(agentId, beliefs, {}, plans)
  setInterval(() => {
    // eslint-disable-next-line
    WoTHelpers.fetch('http://localhost:8080/Production_line').then(async (td) => {
      // eslint-disable-next-line
      let productionLine = await WoT.consume(td)
      const itemsOnLine = await productionLine.readProperty('itemsOnLine')
      const currentProductionSpeed = await productionLine.readProperty('currentSpeed')
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
