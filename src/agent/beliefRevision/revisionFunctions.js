/**
 * Revises beliefs by merging old and new beliefs such that a new belief overwrites an old one in
 * case of conflict.
 * @param {object} oldBeliefs Old belief base (JSON object of beliefs)
 * @param {object} newBeliefs New belief base (JSON object of beliefs)
 * @returns Revised belief base (JSON object of beliefs)
 */
const reviseSimpleNonmonotonic = (oldBeliefs, newBeliefs) => ({ ...oldBeliefs, ...newBeliefs })

/**
 * Revises beliefs by merging old and new beliefs such that an old belief overrides a new one in
 * case of conflict.
 * @param {object} oldBeliefs Old belief base (JSON object of beliefs)
 * @param {object} newBeliefs New belief base (JSON object of beliefs)
 * @returns Revised belief base (JSON object of beliefs)
 */
const reviseMonotonic = (oldBeliefs, newBeliefs) => ({ ...newBeliefs, ...oldBeliefs })

/**
 * Revises beliefs by merging old and new beliefs such that an old belief overrides a new one in case of conflict.
 * @param {object} oldBeliefs Old belief base (JSON object of beliefs)
 * @param {object} newBeliefs New belief base (JSON object of beliefs)
 * @returns Revised belief base (JSON object of beliefs)
 */
const revisePriority = (oldBeliefs, newBeliefs) => ({ ...oldBeliefs, ...Object.fromEntries(
  new Map(
    Object.keys(newBeliefs).map(key =>
      !key in oldBeliefs || oldBeliefs[key].priority == 0 || oldBeliefs[key].priority < newBeliefs[key].priority ? oldBeliefs[key].updatePriority ? [key, newBeliefs[key]] : [key, { ...oldBeliefs[key], value: newBeliefs[key].value }] : [key, oldBeliefs[key]]
    )
  )
) })

/**
 * Revises beliefs by merging old and new beliefs such that an old belief overrides a new one in case of conflict. Does not update belief priorities.
 * case of conflict
 * @param {object} oldBeliefs Old belief base (JSON object of beliefs)
 * @param {object} newBeliefs New belief base (JSON object of beliefs)
 * @returns Revised belief base (JSON object of beliefs)
 */

const revisePriorityStatic = (oldBeliefs, newBeliefs) => revisePriority(Object.fromEntries(
    new Map(
      Object.keys(oldBeliefs).map(key => [
        key,
        { ...oldBeliefs[key], updatePriority: false }
      ])
    )
  ), newBeliefs)

/**
 * Removes all beliefs that are functional beliefs from a belief base and returns the belief base
 * by 'order' value
 * @param {object} beliefs Object of beliefs
 * @returns object of filtered beliefs
 */
const getNonFunctionalBeliefs = beliefs => beliefs
  ? Object.fromEntries(
    new Map(Object.keys(beliefs).filter(
      key => !beliefs[key].rule
    ).map(key => [key, beliefs[key]]))
  ) : {}

/**
 * Removes all beliefs that are not functional beliefs from a belief base and returns the belief base
 * by 'order' value
 * @param {object} beliefs Object of beliefs
 * @returns object of filtered beliefs
 */
const getFunctionalBeliefs = beliefs => beliefs
  ? Object.fromEntries(
    new Map(Object.keys(beliefs).filter(
      key => beliefs[key].rule
    ).map(key => [key, beliefs[key]]))
  ) : {}

/**
 * Removes all beliefs that are not functional beliefs from a belief base and sorts the beliefs
 * by 'order' value
 * @param {object} beliefs Object of beliefs
 * @returns array of filtered and sorted functional beliefs
 */
const preprocessFunctionalBeliefs = beliefs => Object.keys(beliefs).filter(
  key => beliefs[key].rule
).map(
  key => beliefs[key]
).sort((beliefA, beliefB) => beliefA.order < beliefB.order)

/**
 * Applies the functions of all functional beliefs in the provided order
 * 
 * @param {array} oldFunctionalBeliefs Array of current functional beliefs
 * @param {array} newFunctionalBeliefs Array of functional beliefs (update)
 * @param {array} oldBeliefs Object of beliefs, representing the current non-functional beliefs of the agent
 * @param {array} newBeliefs Object of beliefs, representing the belief update
 * @param {function} reviseBeliefs General belief revision function
 * @returns object of updated functional beliefs
 */
const processFunctionalBeliefs = (oldFunctionalBeliefs, newFunctionalBeliefs, oldBeliefs, newBeliefs, reviseBeliefs) => {
  const beliefUpdate = reviseBeliefs(oldFunctionalBeliefs, newFunctionalBeliefs)
  const sortedBeliefUpdate = Object.keys(beliefUpdate).map(key => ({ id: key,  ...beliefUpdate[key] })).sort((beliefA, beliefB) => beliefA.order < beliefB.order)
  return Object.fromEntries(
    new Map(sortedBeliefUpdate.map(belief => [
    belief.id,
    {
      ...belief,
      value: belief.rule(
        { ...oldFunctionalBeliefs, ...oldBeliefs },
        { ...newFunctionalBeliefs, ...newBeliefs }
      )
    }
  ]))
)
}

module.exports = {
  reviseSimpleNonmonotonic,
  reviseMonotonic,
  revisePriority,
  revisePriorityStatic,
  getNonFunctionalBeliefs,
  getFunctionalBeliefs,
  preprocessFunctionalBeliefs,
  processFunctionalBeliefs
}
