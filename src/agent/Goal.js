const warning = 'JS-son: Created goal with non-JSON object, non-JSON data type value'

/**
 * JS-son agent goal generator
 * @param {string} id the goal's unique identifier
 * @param {boolean} isActive indicates whether the goal is active or not
 * @param {any} value the goal's value (optional)
 * @returns {object} JS-son agent goal
 */
const Goal = (id, isActive, value) => {
  const goal = {}
  goal.id = id
  goal.isActive = !!isActive // convert to boolean
  if (value) goal.value = value
  try {
    const parsedGoal = JSON.parse(JSON.stringify(goal))
    if (Object.keys(parsedGoal).length !== Object.keys(goal).length) {
      console.warn(warning)
    }
  } catch (error) {
    console.warn(warning)
  }
  return goal
}

module.exports = Goal
