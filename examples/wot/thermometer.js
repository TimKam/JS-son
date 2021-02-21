/**
 * This script implements a mock of a "thermometer" Thing that can be set to a specific temperature.
*/
// eslint-disable-next-line
WoT.produce({
  title: 'thermometer',
  description: 'A WoT thermometer mock',
  support: 'https://github.com/TimKam/JS-son',
  '@context': [
    'https://www.w3.org/2019/wot/td/v1'
  ],
  properties: {
    temperature: {
      type: 'integer',
      description: 'Current temperature',
      observable: true,
      readOnly: true
    }
  },
  actions: {
    setTemperature: {
      description: 'Sets the temperature, based on the measurement of the corresponding thing',
      uriVariables: {
        temperature: { 'type': 'integer' }
      }
    }
  }
}).then(thing => {
  thing.writeProperty('temperature', 40)
  thing.setActionHandler('setTemperature', (_, options) => {
    try {
      thing.writeProperty('temperature', options['uriVariables']['temperature'])
    } catch (error) {
      console.error(error)
    }
  })

  thing.expose().then(() => console.info(`${thing.getThingDescription().title} ready`))
})
