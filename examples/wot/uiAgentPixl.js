// eslint-disable-next-line
WoT.produce({
  title: 'ui-agent-pixl',
  description: 'Agent that guides human users (located on a Pixl.js)',
  support: 'https://github.com/TimKam/JS-son',
  '@context': [
    'https://www.w3.org/2019/wot/td/v1'
  ],
  properties: {
    isAgent: {
      type: 'boolean',
      description: 'Marks the "thing" as an agent',
      observable: true,
      readOnly: true
    },
    actionQueue: {
      type: 'array',
      description: 'Contains any action requests that are to be sent',
      observable: true,
      readOnly: false
    },
    currentAnalysis: {
      type: 'string',
      description: 'Marks the "thing" as an agent',
      observable: true,
      readOnly: false
    }
  },
  actions: {
    reset: {
      description: 'Purges the action queue and sets and empty analysis status'
    }
  }
}).then(thing => {
  thing.writeProperty('actionQueue', [])
  thing.writeProperty('currentAnalysis', 1)
  thing.expose().then(() => console.info(`${thing.getThingDescription().title} ready`))
})
