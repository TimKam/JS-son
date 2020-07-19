/**
 * This script implements a mock of a "thermometer" Thing that can be set to a specific base
 * temperature and on request provide the temperature, which then roughly corresponds to the
 * specified base temperature.
*/
// eslint-disable-next-line
WoT.produce({
  title: 'Thermometer',
  description: 'A WoT thermometer mock',
  support: 'https://github.com/TimKam/JS-son',
  '@context': [
    'https://www.w3.org/2019/wot/td/v1'
  ],
  properties: {
    baseTemperature: {
      type: 'integer',
      description: 'Current base temperature',
      observable: true,
      readOnly: true
    }
  },
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
  }
}).then(thing => {
  thing.writeProperty('baseTemperature', 40)
  thing.setActionHandler('reportTemperature', () => {
    return thing.readProperty('baseTemperature').then(baseValue => {
      return determineReturnValue(baseValue)
    })
  })

  thing.setActionHandler('measureTemperature', (_, options) => {
    return thing.readProperty('baseTemperature').then(baseValue => {
      let value = baseValue
      try {
        const isJammed = options['uriVariables']['isJammed']
        value = isJammed ? value + 2 : value
        const speedHistory = options['uriVariables']['speedHistory'].split(',')
        const recentSpeeds = speedHistory.slice(Math.max(speedHistory.length - 5, 0))
        const recentSpeedAvg =
          recentSpeeds.map(el => parseInt(el)).reduce((a, b) => a + b) / recentSpeeds.length
        value = value + (recentSpeedAvg * recentSpeedAvg / 2 - 10)
        value = value > 40 ? value : 40
        console.log(`Setting base temperature to ${value}`)
        thing.writeProperty('baseTemperature', value)
      } catch (error) {
        console.error(error)
      }
      return determineReturnValue(baseValue)
    })
  })
  thing.expose().then(() => console.info(`${thing.getThingDescription().title} ready`))
})

function determineReturnValue (baseValue) {
  const value = baseValue + (Math.random() - 0.5) * 5
  if (value < -100 || value > 1000) {
    return determineReturnValue(value < -100 ? -100 : 1000)
  } else {
    return value
  }
}
