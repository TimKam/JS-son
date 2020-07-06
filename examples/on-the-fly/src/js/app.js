import $$ from 'dom7'
import Framework7 from 'framework7/framework7.esm.bundle.js'
import 'framework7/css/framework7.bundle.css'
import * as monaco from 'monaco-editor'
// import js-son and assign Belief, Plan, Agent, and Environment to separate consts
import { Plan } from 'js-son-agent'
// Icons and App Custom Styles
import '../css/icons.css'
import '../css/app.css'
// Import Routes
import routes from './routes.js'
// Game of Life
import GameOfLife from './GameOfLife'

window.determineNeighborActivity = (index, activityArray) => {
  const leftNeighbors = index % 10 === 0
    ? []
    : [activityArray[index - 11], activityArray[index - 1], activityArray[index + 9]]

  const rightNeighbors = index % 10 === 9
    ? []
    : [activityArray[index - 9], activityArray[index + 1], activityArray[index + 11]]
  return [
    activityArray[index - 10],
    activityArray[index + 10]
  ].concat(leftNeighbors, rightNeighbors).filter(element => element).length
}

window.Plan = Plan

document.addEventListener('copy', event => {
  event.clipboardData.setData('text/plain', JSON.stringify(window.gameOfLife.state))
  event.preventDefault()
})

document.addEventListener('paste', event => {
  let state
  try {
    state = JSON.parse(event.clipboardData.getData('text/plain'))
  } catch (_) { console.log(`eval error on paste: ${_}`) }
  window.gameOfLife.state = state
  event.preventDefault()
})

var app = new Framework7({ // eslint-disable-line no-unused-vars
  root: '#app', // App root element

  name: 'JS-son: Game of Life', // App name
  theme: 'auto', // Automatic theme detection
  // App root data
  data: () => {
    $$(document).on('page:init', e => {
      window.editor = monaco.editor.create(document.getElementById('editor'), {
        value: [
          `
[
  Plan(
    beliefs => {
      const neighborActivity = determineNeighborActivity(beliefs.index, beliefs.activityArray)
      const isActive = beliefs.activityArray[beliefs.index]
      return (isActive && neighborActivity >= 2 && neighborActivity < 4) ||
        neighborActivity === 3
    },
    () => ({ nextRound: 'active' })
  ),
  Plan(
    beliefs => {
      const neighborActivity = determineNeighborActivity(beliefs.index, beliefs.activityArray)
      const isActive = beliefs.activityArray[beliefs.index]
      return !(isActive && neighborActivity >= 2 && neighborActivity < 4) &&
        !neighborActivity === 3
    },
    () => ({ nextRound: 'inActive' })
  )
]
          `
        ].join('\n'),
        language: 'javascript'
      })
      window.gameOfLife = GameOfLife()
      window.editor.onDidType(() => {
        const tPlans = window.editor.getValue()
        let evalSuccess = false
        try {
          const plans = eval(tPlans)
          plans.forEach(plan => plan.run(window.gameOfLife.agents[0].beliefs))
          evalSuccess = true
        } catch (_) { console.log(`eval error: ${_}`) }
        if (evalSuccess) {
          Object.keys(window.gameOfLife.agents).forEach(key => { window.gameOfLife.agents[key].plans = eval(tPlans) })
        }
      })
      let shouldRestart = false
      $$('.restart-button').on('click', () => {
        shouldRestart = true
      })
      window.setInterval(() => {
        if (shouldRestart) {
          shouldRestart = false
          window.gameOfLife = GameOfLife()
        } else {
          window.gameOfLife.run(1)
        }
      }, 500)
    })
  },
  // App routes
  routes: routes
})
