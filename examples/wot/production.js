/**
 * This script implements a "production line" thing that simulates a production line that combines
 * an assembly line and a casting machine. The casting machine can produce at different speeds.
 * However, a faster running machine will heat up (and produce initially "hotter" items),
 * which can have a negative impact on quality, *i.e.*, increase the scrap rate.
 */

let speed = 1
let itemsOnLine = 0
let isBroken = false
let isJammed = false
const speedHistory = []
let temperature

// eslint-disable-next-line
WoT.produce({
  title: 'production_line',
  description: 'A WoT production line mock',
  support: 'https://github.com/TimKam/JS-son',
  '@context': [
    'https://www.w3.org/2019/wot/td/v1'
  ],
  properties: {
    speed: {
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
  },
  actions: {
    setSpeed: {
      description: 'Set the speed of the production line. A speed of 0 means the production line stops.',
      uriVariables: {
        speed: { 'type': 'integer', 'minimum': 0, 'maximum': 10 }
      }
    },
    pickUpItem: {
      description: 'Pick up the first item from the production line'
    }
  }
}).then(thing => {
  thing.writeProperty('speed', 1)

  thing.setActionHandler('setSpeed', (_, options) => {
    try {
      speed = options['uriVariables']['speed']
      console.log(`Setting speed to ${speed}`)
      if (speed >= 0 && speed <= 10) thing.writeProperty('speed', speed)
    } catch (error) {
      console.error(error)
    }
  })

  thing.setActionHandler('pickUpItem', () => {
    return thing.readProperty('itemsOnLine').then((count) => {
      if (count > 0) {
        thing.writeProperty('itemsOnLine', --count)
        console.log(`Item picked up. Remaining items ${count}`)
        let scrap = Math.random() < (temperature - 50) / 300
        if (isJammed) {
          scrap = Math.random() > 0.2 ? scrap : true
        }
        return { content: 'item', scrap }
      } else {
        console.error('Could not pick up items; no items on the line.')
        return { content: undefined }
      }
    })
  })
  thing.expose().then(() => console.info(`${thing.getThingDescription().title} ready`))
  setInterval(() => {
    speedHistory.push(speed)
    // eslint-disable-next-line
    WoTHelpers.fetch('http://localhost:8080/thermometer').then(async (td) => {
      // eslint-disable-next-line
      let thermometer = await WoT.consume(td)
      temperature = await thermometer.invokeAction(
        'measureTemperature',
        undefined,
        { uriVariables: { 'jammed': true, 'speedHistory': speedHistory } }
      )
      console.info(`Temperature: ${temperature}`)
      isBroken = temperature < 350 ? isBroken : true
      isJammed = itemsOnLine > 50 ? true : isJammed
      if (speed !== 0 && !isBroken && !isJammed) {
        thing.writeProperty('itemsOnLine', ++itemsOnLine)
        console.info(`New item produced. Items on line: ${itemsOnLine}.`)
      }
    }).catch(error => { console.error(`Fetch error: ${error}`) })
  }, 5000 / (speed === 0 ? 10 : speed))
})
