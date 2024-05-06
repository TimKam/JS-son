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
 * Revises beliefs by merging old and new beliefs such that an old belief overrides a new one in
 * case of conflict
 * @param {object} oldBeliefs Old belief base (JSON object of beliefs)
 * @param {object} newBeliefs New belief base (JSON object of beliefs)
 * @returns Revised belief base (JSON object of beliefs)
 */
const revisePriority = (oldBeliefs, newBeliefs) => Object.fromEntries(
  new Map(
    Object.keys(newBeliefs).map(key =>
      !key in oldBeliefs || oldBeliefs[key].priority == 0 || oldBeliefs[key].priority < newBeliefs[key].priority ? oldBeliefs[key].updatePriority ? [key, newBeliefs[key]] : [key, { ...oldBeliefs[key], value: newBeliefs[key].value }] : [key, oldBeliefs[key]]
    )
  )
)

/**
 * Revises beliefs by merging old and new beliefs such that an old belief overrides a new one in. Does not update belief priorities.
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

module.exports = {
  reviseSimpleNonmonotonic,
  reviseMonotonic,
  revisePriority,
  revisePriorityStatic
}
