/* "Room" multi-agent system example for the Pixl.js */
const beliefs = { door: { locked: true } };

global.Plans = [
  Plan(
    function (beliefs) {
      if (!beliefs.door.locked && beliefs.requests.includes('lock')) {
        return { door: 'lock' };
      }
      if (beliefs.door.locked && beliefs.requests.includes('unlock')) {
        return { door: 'unlock' };
      }
    }
  ),
  Plan(
    function (beliefs) {
      if (!beliefs.door.locked) {
        return { request: 'lock' };
      }
      if (beliefs.door.locked && !beliefs.doorPrev.locked) {
        return { announce: 'Thanks for locking the door!' };
      }
    }
  ),
  Plan(
    function (beliefs) {
      if (beliefs.door.locked) {
        return { request: 'unlock' };
      }
      if (!beliefs.door.locked && !beliefs.doorPrev.locked) {
        return { announce: 'Thanks for unlocking the door!' };
      }
    }
  )
];

const plansPorter = 0;

const porter = new Agent('porter', beliefs, plansPorter);

const plansParanoid = 1;

const paranoid = new Agent('paranoid', beliefs, plansParanoid);

const plansClaustrophobe = 2;

const claustrophobe = new Agent('claustrophobe', beliefs, plansClaustrophobe);

const state = { door: { locked: true }, doorPrev: { locked: true }, requests: [] };

const updateState = function (action, agentId, currentState) {
  const stateUpdate = {
    requests: currentState.requests,
    doorPrev: currentState.door,
    actions: currentState.actions || {}
  };
  if (!action) {
  } else if (action.door === 'lock') {
    stateUpdate.door = { locked: true };
    stateUpdate.requests = [];
    stateUpdate.actions[agentId] = 'Lock door';
  } else if (action.door === 'unlock') {
    stateUpdate.door = { locked: false };
    stateUpdate.requests = [];
    stateUpdate.actions[agentId] = 'Unlock door';
  } else if (action.request === 'lock') {
    stateUpdate.requests.push('lock');
    stateUpdate.actions[agentId] = 'Request: lock door';
  } else if (action.request === 'unlock') {
    stateUpdate.requests.push('unlock');
    stateUpdate.actions[agentId] = 'Request: unlock door';
  } else if (action.announce) {
    stateUpdate.actions[agentId] = `${action.announce}`;
  }
  return stateUpdate;
};

function stateFilter (state) { return state; }

function render (state) {
  g.clear();
  Object.keys(state.actions).forEach(function (agentId) {
    const message = `${agentId}: ${state.actions[agentId]}`;
    g.drawString(message, (128 - g.stringWidth(message)) / 2, 20 + agentId * 10);
  });
  g.flip(true);
}

const environment = new Environment(
  [paranoid, claustrophobe, porter],
  state,
  updateState,
  render,
  stateFilter
);

LED1.set();
setInterval(function () { environment.run(1); }, 5000);
