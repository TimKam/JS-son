const updateMAS = actions => {
  const stateUpdate = {}
  actions.forEach(action => {
    if (action.actions.includes('Here, take some food!')) stateUpdate.foodAvailable = true
    if (action.actions.includes('Good dog!')) stateUpdate.dogRecentlyPraised = true
    else stateUpdate.dogRecentlyPraised = false
    if (action.actions.includes('Eat')) {
      stateUpdate.foodAvailable = false
      stateUpdate.dogHungry = false
    }
  })
  return stateUpdate
}

module.exports = {
  updateMAS
}
