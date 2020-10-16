import Plotly from 'plotly.js-dist'
import $$ from 'dom7'
import Framework7 from 'framework7/framework7.esm.bundle.js'
import 'framework7/css/framework7.bundle.css'
// Icons and App Custom Styles
import '../css/icons.css'
import '../css/app.css'
// Import Routes
import routes from './routes.js'
// Game of Life
import Arena from './Arena'

window.arena = undefined

// rewards
const rewards = [[], []]
const rewardsSliding = [[], []]
let regretIterator = 0

var app = new Framework7({ // eslint-disable-line no-unused-vars
  root: '#app', // App root element

  name: 'JS-son: Arena', // App name
  theme: 'auto', // Automatic theme detection
  // App root data
  data: () => {
    $$(document).on('page:init', e => {
      arena = Arena()
      let shouldRestart = false
      $$('.restart-button').on('click', () => {
        shouldRestart = true
      })
      window.setInterval(() => {
        if (shouldRestart) {
          shouldRestart = false
          arena = Arena()
        } else {
          arena.run(1)
          // console.log(arena)
          $$('#arena-grid').html(arena.render(arena.state))
          $$('#analysis').html(`
            <table>
              <tr>
                <td><strong>Agent</strong></td>
                ${arena.state.positions.map((_, index) => `<td>${index}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Health</strong></td>
                ${arena.state.health.map(healthScore => `<td>${healthScore}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Coins</strong></td>
                ${arena.state.coins.map(coins => `<td>${coins}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Total Rewards</strong></td>
                ${arena.state.rewardsAcc.map(r => `<td>${r}</td>`).join('')}
              </tr>
            </table>
          `)
          rewards[0].push(arena.state.rewards[0])
          rewards[1].push(arena.state.rewards[1])
          if (regretIterator < 10) {
            regretIterator++
            return
          }
          rewardsSliding[0].push(
            rewards[0].slice(rewards[0].length - 10).reduce((partialSum, a) => partialSum + a, 0) / 10
          )
          rewardsSliding[1].push(
            rewards[0].slice(rewards[1].length - 10).reduce((partialSum, a) => partialSum + a, 0) / 10
          )
          const trace1 = {
            x: Array.apply(null, { length: rewards[0].length }).map(Number.call, Number),
            y: rewards[0],
            type: 'scatter'
          }
          Plotly.newPlot('reward-plot', [trace1], { title: 'Rewards: Average, Last 10 Steps' })
        }
      }, 250)
    })
  },
  // App routes
  routes: routes
})
