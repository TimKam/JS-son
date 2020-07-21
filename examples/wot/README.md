# Web of Things Scripting API Integration
The [Web of Things (WoT) Scripting API](https://www.w3.org/TR/wot-scripting-api/) is an API specification draft for exposing, consuming and discovering *Things* (IoT devices) on the Web.
This project presents an example integration of JS-son and a WoT Scripting API implementation.
Running JS-son agents on Things can be useful because it constitutes a lightweight approach to instill goal-oriented behavior into Things (where the goal-driven program runs directly *on* a Thing).

## Example Scenario
The implementation presents the following (fictitious) example scenario.
We have a robot (agent) that takes items from an assembly line that is connected to a casting machine (thing) and packs them into boxes.
The robot can, at any time, configure the assembly line to run/the casting machine to produce faster or slower.
However, a faster running machine will heat up (and produce initially "hotter" items), which can have a negative impact on quality, *i.e.*, increase the scrap rate.
The robot can use the scrap rate as a means to inform its control of the production line's speed.
The robot can be configured to aim at not exceeding a specifiable scrap rate while maximizing production speed. 

## Implementation 
We implement two "classical" things: a thermometer and a production line.
In addition, we implement one "agent" thing.
Using the W3C WoT terminology, we can refer to a thing as a *servient*.

### Project Setup
First, let us set up the project. We make use of the [Eclipse Foundation's Web of Things Node.js implementation](https://github.com/eclipse/thingweb.node-wot).
Run ``npm init`` on the command line and follow the instructions on the command line prompt to generate the ``package.json`` file.
Then, install the following dependencies (JS-son and the Web of Things implementation tools):

```
npm install @node-wot/core @node-wot/binding-coap @node-wot/cli js-son-agent --save
```

Adjust the scripts of your project's ``package.json`` as follows:

```
"scripts": {
  "start": "node ./node_modules/@node-wot/cli/dist/cli.js"
  ...
}
```

### Thermometer Thing
This script implements a mock of a "thermometer" Thing that can be set to a specific base temperature and on request provide the temperature, which then roughly corresponds to the specified base temperature.
The thermometer thing has the property ``baseTemperature``, which defines the current *approximate* temperature the thermometer is measuring.

```JavaScript
  properties: {
    baseTemperature: {
      type: 'integer',
      description: 'Current base temperature',
      observable: true,
      readOnly: true
    }
  }
```
However, thermometer reports slightly diverge from the base temperature to simulate volatility and measurement imprecision.

To set the base temperature and to return measurements, the thermometer thing supports the following actions:

* ``reportTemperature``: returns the *approximate* temperature that has been measured by the thermometer.

* ``measureTemperature``: simulates a measurement the temperature of the production line (see below): the temperature is determined based on the recent average speed of the production line; also, if the production line is currently jammed, a higher temperature is measured. 

```JavaScript
  actions: {
    reportTemperature: {
      description: 'Return a temperature that is approximately as high as the base temperature'
    },
    measureTemperature: {
      description: '"Measure" the production line\'s temperature based on some key properties',
      uriVariables: {
        isJammed: { 'type': 'boolean' },
        speedHistory: { 'type': 'array' }
      }
    }
```

The full code of the thermometer thing (including the implementation of the action handlers) is available [here](./thermometer.js).

### Production Line Thing
The production line thing simulates the production of items at variable speeds.
The speed of the production line can be configured and informs the production line's temperature, which in turn informs the scrap rate among the produced items.
Produced items need to be picked up from the line.
The production line's capacity is 50 items, *i.e.*, if more than 50 items are on the line, the line jams and cannot produce more items until capacity is freed (items are picked up).

The production line thing has the following properties:

* ``currentSpeed``: the current speed of the production line, an integer between (including) 0 and 10.

* ``itemsOnLine``: the number of items on the line.

* ``isBroken``: ``true`` iff the production line is broken and cannot produce any new items.

* ``isJammed``: ``true`` iff the production line is jammed and cannot produce any new items until an item has been picked up from the line.

```JavaScript
  properties: {
    currentSpeed: {
      type: 'integer',
      description: 'Current speed of the production line',
      observable: true,
      readOnly: true
    },
    itemsOnLine: {
      type: 'integer',
      description: 'Current items on the production line that can be picked up',
      observable: true,
      readOnly: true
    },
    isBroken: {
      type: 'boolean',
      description: 'Is true iff the production line is broken',
      observable: true,
      readOnly: true
    },
    isJammed: {
      type: 'boolean',
      description: 'Is true iff the production line is jammed, i.e., iff there are too many items on the line',
      observable: true,
      readOnly: true
    }
  }
```

The production line thing supports the following actions:

* ``setSpeed``: Sets the speed of the production line.

* ``pickUpItem``: Removes the first item from the production line. (In fact the simulator generates the item properties when the item is picked up, so the order of items does not matter.)

```JavaScript
  setSpeed: {
      description: 'Set the speed of the production line. A speed of 0 means the production line stops.',
      uriVariables: {
        speed: { 'type': 'integer', 'minimum': 0, 'maximum': 10 }
      }
    },
    pickUpItem: {
      description: 'Pick up the first item from the production line'
    }
```


The full code of the production line thing (including the implementation of the action handlers) is available [here](./production.js).

### Robot Agent
The robot agent is the only *thing* that is an autonomous entity and hence integrates the WoT Scripting API implementation with a JS-son-based belief-plan agent.
First, we specify the thing properties and actions, analogously to the way we have done this for the non-autonomous things.
The robot agent has the following properties (for the sake of conciseness, the tutorial merely provides the thing specification excerpts):

```JavaScript
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

```

In addition, the robot supports the following actions:

```JavaScript
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
```

However, it is clear that the robot's behavior is not fully described by the action specification.
In the property specification, we see that the agent has a *scrap rate goal* and it should continuously controlling the assembly line, and produce and pack items at maximal speed with the constraint set by the maximal scrap rate.
For this, the agent needs a set of plans:

```JavaScript
const plans = [...]
```

1. The first plan updates the thing properties based on the agent's beliefs (note that the plan's head is always ``true``; in contrast, all other plans require the agent to be "running"):

```JavaScript
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
)
```

2. The second plan checks if the production line is jammed or broken and stops the line (if the production line's speed is greater than 0):

```JavaScript
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
)
```

3. The third plan picks up an item from the production line if any item is available:

```JavaScript
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
)
```

4. The fourth plan decreases the production line's speed if the current scrap rate is too high:
```JavaScript
Plan(
  beliefs => (
    !beliefs.isAssignedToJammedLine ||
    !beliefs.isRunning ||
    (beliefs.scrapRate > beliefs.scrapRateGoal && beliefs.currentProductionSpeed > 1)
  ) && beliefs.currentProductionSpeed > 0,
  // slow down production line
  beliefs => beliefs.productionLine.invokeAction(
    'setSpeed',
    undefined,
    { uriVariables: { 'speed': --beliefs.currentProductionSpeed } }
  )
)
```

5. Finally, the fifth plan increases the production line's speed if the current scrap rate is below the threshold (this plan is mutually exclusive with the fourth plan):
```JavaScript
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
```

The agent script contains a mapping function that can generate a JS-son agent from a thing description and an array of plans, which requires to set the value of all properties beforehand:

```JavaScript
thing.writeProperty('isRunning', true)
thing.writeProperty('scrapRateGoal', 0.025)
thing.writeProperty('scrapRate', 0)
thing.writeProperty('currentProductionSpeed', 0)
thing.writeProperty('overallPackingSpeed', 0)
thing.writeProperty('isAssignedToBrokenLine', false)
thing.writeProperty('isAssignedToJammedLine', false)
thing.writeProperty('packingHistory', [])
thing.writeProperty('scrapHistory', [])

const robot = thingToAgent(thing, plans)
```

Finally, we execute the ``next()`` function of the agent in regular intervals and get the belief update from the things the agent interacts with:

```JavaScript
setInterval(() => {
  WoTHelpers.fetch('http://localhost:8080/Production_line').then(async (td) => {
    let productionLine = await WoT.consume(td)
    const itemsOnLine = await productionLine.readProperty('itemsOnLine')
    const currentProductionSpeed = await productionLine.readProperty('currentSpeed')
    const isAssignedToBrokenLine = await productionLine.readProperty('isBroken')
    const isAssignedToJammedLine = await productionLine.readProperty('isJammed')
    const scrapRateGoal = await thing.readProperty('scrapRateGoal')
    robot.next({
      thing,
      productionLine,
      itemsOnLine,
      currentProductionSpeed,
      isAssignedToBrokenLine,
      isAssignedToJammedLine,
      scrapRateGoal
    })
  })
}, 1000)
```


The full code of the production line thing (including the implementation of the action handlers and plans) is available [here](./agent.js).

## Running the example
First, install the project's dependencies:

```
npm install
```

To run the example, start the servients by executing ``npm run start`` on your command line.
