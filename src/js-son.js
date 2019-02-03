const defaultState = {
    beliefs = [],
    desires = [],
    intentions  = [],
    plans  = [],
}

// default beliefs and belief update function
const updateBeliefs = (beliefs, manipulator) => beliefs
const determineDesires = (beliefs, reducer) => beliefs.reduce()
const determineIntentions = (desires, reducer) => []
const determinePlans = (beliefs, intentions, reducer) => []

const defaultFunctions = {
    updateBeliefs,
    determineDesires,
    determineIntentions,
    determinePlans,
}

const js_son = (state = defaultState, functions = defaultFunctions) => ({
    state,
    functions,
})

export default js_son