/**
 * This script implements a mock of a "thermometer" Thing that can be set to a specific temperature.
*/
// helper:
const hashCode = s => s.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
// eslint-disable-next-line
WoT.produce({
  title: 'action_sensor_a',
  description: 'An action sensor that triggers the addition of a new item with product configuration "A" to the thing\'s assembly queue.',
  support: 'https://github.com/TimKam/JS-son',
  '@context': [
    'https://www.w3.org/2019/wot/td/v1'
  ],
  properties: {
    history: {
      type: 'array',
      description: 'The history of items whose assembly has been requested',
      observable: true,
      readOnly: true
    }
  },
  actions: {
    triggerAssembly: {
      description: 'Triggers the addition of a new item with product configuration "A" to the thing\'s assembly queue'
    }
  }
}).then(thing => {
  thing.writeProperty('history', [])
  thing.setActionHandler('triggerAssembly', () => {
    try {
      const configuration = 'A'
      const id = `${hashCode(new Date())}-${configuration}`
      console.log(`Adding item to thing-internal queue: id: ${id}-${id}, configuration: ${configuration}`)
      thing.readProperty('queue').then(queue => {
        queue.push({ configuration, id })
        thing.writeProperty('queue', queue)
      })
    } catch (error) {
      console.error(error)
    }
  })
  thing.expose().then(() => console.info(`${thing.getThingDescription().title} ready`))
})
