/* JS-son Game of Life implementation for the Espruino Pixl.js */

const NUMBER_OF_AGENTS = 5;

function determineNeighborActivity (index, activityArray) {
  const leftNeighbors = index % 10 === 0
    ? []
    : [activityArray[index - 11], activityArray[index - 1], activityArray[index + 9]];
  const rightNeighbors = index % 10 === 9
    ? []
    : [activityArray[index - 9], activityArray[index + 1], activityArray[index + 11]];
  return [
    activityArray[index - 10],
    activityArray[index + 10]
  ].concat(leftNeighbors, rightNeighbors).filter(element => element).length;
}

global.Plans = [
  Plan(
    beliefs => {
      const neighborActivity = determineNeighborActivity(beliefs.index, beliefs.activityArray);
      const isActive = beliefs.activityArray[beliefs.index];
      return (isActive && neighborActivity >= 2 && neighborActivity < 4) || neighborActivity === 3;
    },
    () => ({ nextRound: 'active' })
  )
];

const initialActivity = new Array(NUMBER_OF_AGENTS).fill(0).map((_, index) => Math.random() < 0.5);

const agents = initialActivity.map((value, index) => {
  const beliefs = { index: index, activityArray: initialActivity };
  return new Agent(index, beliefs, [0]);
});

const initialState = {
  previousActivity: initialActivity,
  nextActivity: []
};

function updateState (actions, agentId, currentState) {
  const stateUpdate = Object.assign({}, currentState, {});
  const agentActive = actions.some(action => action.nextRound === 'active');
  stateUpdate.nextActivity.push(agentActive);
  if (agentId === '99') {
    return {
      previousActivity: stateUpdate.nextActivity,
      nextActivity: []
    };
  }
  return stateUpdate;
}

function stateFilter (state) { return { activityArray: state.previousActivity }; }

function render (state) {
  console.log(state);
}

environment = new Environment(agents, initialState, updateState, render, stateFilter);

setInterval(function () { environment.run(1) }, 1000);
