'use strict'

const {
  Belief,
  Desire,
  Plan,
  Agent,
  Environment
} = require('js-son-agent')

/**
* HTTP Cloud Function.
*
* @param {Object} req Cloud Function request context.
*                     More info: https://expressjs.com/en/api.html#req
* @param {Object} res Cloud Function response context.
*                     More info: https://expressjs.com/en/api.html#res
*/
exports.simulate = (req, res) => {
  if (!(req.query.bias && req.query.ticks)) {
    res.status(400)
    res.send(`Your query: ${JSON.stringify(req.query)}. Please specify bias and number of ticks`)
  }
  res.send(run(parseInt(req.query.bias), parseInt(req.query.ticks)))
}

/**
* HTTP Cloud Function.
*
* @param {Number} bias The higher the bias, the stronger the facilitation of ``true`` announcements
* @param {Number} ticks Amount of ticks the simulation should run
*/
function run (bias, ticks) {
  const beliefsTrue = {
    ...Belief('keyBelief', true),
    ...Belief('pastReceivedAnnouncements', [])
  }

  const beliefsFalse = {
    ...Belief('keyBelief', false),
    ...Belief('pastReceivedAnnouncements', [])
  }

  const determinePredominantBelief = beliefs => {
    const announcementsTrue = beliefs.pastReceivedAnnouncements.filter(
      announcement => announcement
    ).length
    const announcementsFalse = beliefs.pastReceivedAnnouncements.filter(
      announcement => !announcement
    ).length
    const predominantBelief = announcementsTrue > announcementsFalse ||
      (announcementsTrue === announcementsFalse && beliefs.keyBelief)
    return predominantBelief
  }

  const desiresVolatile = {
    ...Desire('announceTrue', beliefs => {
      const pastReceivedAnnouncements = beliefs.pastReceivedAnnouncements.length >= 5
        ? beliefs.pastReceivedAnnouncements.slice(-5)
        : new Array(5).fill(beliefs.keyBelief)
      const recentBeliefs = {
        ...beliefs,
        pastReceivedAnnouncements
      }
      return determinePredominantBelief(recentBeliefs)
    }),
    ...Desire('announceFalse', beliefs => {
      const pastReceivedAnnouncements = beliefs.pastReceivedAnnouncements.length >= 5
        ? beliefs.pastReceivedAnnouncements.slice(-5)
        : new Array(5).fill(beliefs.keyBelief)
      const recentBeliefs = {
        ...beliefs,
        pastReceivedAnnouncements
      }
      return !determinePredominantBelief(recentBeliefs)
    })
  }
  
  const desiresIntrospective = {
    ...Desire('announceTrue', beliefs => determinePredominantBelief(beliefs)),
    ...Desire('announceFalse', beliefs => !determinePredominantBelief(beliefs))
  }

  const plans = [
    Plan(intentions => intentions.announceTrue, () => [ { announce: true } ]),
    Plan(intentions => intentions.announceFalse, () => [ { announce: false } ])
  ]

  const state = {}

  const createAgents = () => {
    const agents = new Array(100).fill({}).map((_, index) => {
      // assign agent types--introspective and volatile--to odd and even numbers, respectively:
      const type = index % 2 === 0 ? 'volatile' : 'introspective'
      const desires = type === 'volatile' ? desiresVolatile : desiresIntrospective
      /* ``true`` as belief: 30 volatile and 20 introspective agents
         ``false`` as belief: 20 volatile and 30 introspective agents:
      */
      const beliefs = (index < 50 && index % 2 === 0) || (index < 40 && index % 2 !== 0) ? beliefsTrue
        : beliefsFalse
      // add agent belief to the environment's state:
      state[`${type}${index}`] = { keyBelief: beliefs.keyBelief }
      // create agent:
      return new Agent(
        `${type}${index}`,
        { ...beliefs, ...Belief('type', type) },
        desires,
        plans
      )
    })
    const numberBeliefsTrue = Object.keys(state).filter(
      agentId => state[agentId].keyBelief
    ).length
    const numberBeliefsFalse = Object.keys(state).filter(
      agentId => !state[agentId].keyBelief
    ).length
    console.log(`True: ${numberBeliefsTrue}; False: ${numberBeliefsFalse}`)
    return agents
  }

  const updateState = (actions, agentId, currentState) => {
    const stateUpdate = {}
    actions.forEach(action => {
      stateUpdate[agentId] = {
        keyBelief: action.find(action => action.announce !== undefined).announce
      }
    })
    return stateUpdate
  }

  const stateFilterGenerator = bias => (state, agentKey, agentBeliefs) => {
    const volatileAnnouncements = []
    const introspectiveAnnouncements = []
    Object.keys(state).forEach(key => {
      if (key.includes('volatile')) {
        volatileAnnouncements.push(state[key].keyBelief)
      } else {
        introspectiveAnnouncements.push(state[key].keyBelief)
      }
    })
    const recentVolatileAnnouncements = volatileAnnouncements.sort(
      () => 0.5 - Math.random()
    ).slice(0, 3)
    const recentIntrospectiveAnnouncements = introspectiveAnnouncements.sort(
      () => 0.5 - Math.random()
    ).slice(0, 2)
    // add some noise
    let noise = Object.keys(state).filter(agentId => state[agentId].keyBelief).length < (79 - bias) * Math.random() ? [true] : []
    noise = Object.keys(state).filter(agentId => state[agentId].keyBelief).length < bias * Math.random() ? [false] : noise
    // combine announcements
    const pastReceivedAnnouncements =
      recentVolatileAnnouncements.concat(
        recentIntrospectiveAnnouncements, agentBeliefs.pastReceivedAnnouncements, noise
      )
    return { pastReceivedAnnouncements, keyBelief: state[agentKey].keyBelief }
  }

  const render = state => {
    const numberBeliefsTrue = Object.keys(state).filter(
      agentId => state[agentId].keyBelief
    ).length
    const numberBeliefsFalse = Object.keys(state).filter(
      agentId => !state[agentId].keyBelief
    ).length
    console.log(`True: ${numberBeliefsTrue}; False: ${numberBeliefsFalse}`)
  }

  const result = new Environment(
    createAgents(),
    state,
    updateState,
    render,
    stateFilterGenerator(20 + bias)
  ).run(ticks)

  return result
}
