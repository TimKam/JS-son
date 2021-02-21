/* JS-son Game of Life implementation for the Espruino Pixl.js */

const NUMBER_OF_AGENTS = 16;
const sqrtAgents = Math.sqrt(NUMBER_OF_AGENTS);

function determineNeighborActivity (index, activityArray) {
  const leftNeighbors = index % sqrtAgents === 0
    ? []
    : [activityArray[index - sqrtAgents + 1], activityArray[index - 1], activityArray[index + sqrtAgents - 1]];
  const rightNeighbors = index % sqrtAgents === sqrtAgents - 1
    ? []
    : [activityArray[index - (sqrtAgents - 1)], activityArray[index + 1], activityArray[index + sqrtAgents + 1]];
  return [
    activityArray[index - sqrtAgents],
    activityArray[index + sqrtAgents]
  ].concat(leftNeighbors, rightNeighbors).filter(function (element) { return element; }).length;
}

global.Plans = [
  Plan(
    function (beliefs) {
      const neighborActivity = determineNeighborActivity(beliefs.index, beliefs.activityArray);
      const isActive = beliefs.activityArray[beliefs.index];
      if ((isActive && neighborActivity >= 2 && neighborActivity < 4) || neighborActivity === 3) {
        return { nextRound: 'active' };
      }
    }
  )
];

const initialActivity = new Array(NUMBER_OF_AGENTS).fill(0).map(
  function () { return Math.random() < 0.5; }
);

const agents = initialActivity.map((_, index) => {
  const beliefs = { index: index, activityArray: initialActivity };
  return new Agent(index, beliefs, 0);
});

const initialState = {
  previousActivity: initialActivity,
  nextActivity: []
};

function updateState (action, agentId, currentState) {
  const stateUpdate = Object.assign({}, currentState, {});
  const agentActive = action && action.nextRound === 'active';
  stateUpdate.nextActivity.push(agentActive);
  if (agentId === `${NUMBER_OF_AGENTS - 1}`) {
    return {
      previousActivity: stateUpdate.nextActivity,
      nextActivity: []
    };
  }
  return stateUpdate;
}

function stateFilter (state) { return { activityArray: state.previousActivity }; }

function render (state) {
  for (let i = 0; i < Math.sqrt(NUMBER_OF_AGENTS); i++) {
    const subState = state.previousActivity.slice(
      i * Math.sqrt(NUMBER_OF_AGENTS), (i + 1) * Math.sqrt(NUMBER_OF_AGENTS)
    );
    console.log(subState);
  }
}

environment = new Environment(agents, initialState, updateState, render, stateFilter);

setInterval(function () { environment.run(1); }, 3000);
