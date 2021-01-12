/** JS-son version that is optimized for running on Espruino devices */

/* out-comment these lines when testing Edge JS-son in a browser
try {
  global = global;
} catch (e) {
  global = window;
}
*/

function Agent (id, beliefs, plans) {
  this.id = id;
  this.beliefs = beliefs;
  this.plans = plans;
  this.isActive = true;
  this.next = function (beliefs) {
    beliefs = Object.assign({}, this.beliefs, beliefs);
    this.beliefs = beliefs;
    if (this.isActive) {
      return this.plans.map(function (plan) {
        return global.Plans[plan].run.apply(this, [beliefs]);
      }).filter(function (result) { return result !== null; });
    }
  };
  this.stop = () => (this.isActive = false);
  this.start = () => (this.isActive = true);
}

function RemoteAgent (id, beliefs, next) {
  this.id = id;
  this.beliefs = beliefs;
  this.isActive = true;
  this.next = next;
  this.stop = () => (this.isActive = false);
  this.start = () => (this.isActive = true);
}

function Belief (id, value) {
  const belief = {};
  belief[id] = value;
  return belief;
}

function Plan (body) {
  return {
    body: body,
    run: function (beliefs) {
      return body.apply(this, [beliefs]);
    }
  };
}

function Environment (agents, state, update, render, stateFilter, runner, logHistory) {
  function defaultStateFilter (state) { return state; }
  const defaultRunner = function (run) {
    return function (iterations) {
      if (iterations) {
        Array(iterations).fill(0).forEach(run);
      } else {
        while (true) run();
      }
    };
  };
  this.agents = agents;
  this.state = state;
  this.update = update;
  this.render = render;
  this.stateFilter = stateFilter || defaultStateFilter;
  this.history = [];
  this.runner = runner || defaultRunner;
  this.logHistory = logHistory || false;
  this.reset = () => (this.history = []);
  this.run = iterations => {
    if (this.logHistory) this.history.push(this.state);
    const run = () => {
      Object.keys(this.agents).forEach(agentKey => {
        const proposedUpdate = this.agents[agentKey].next(
          this.stateFilter(this.state, agentKey, this.agents[agentKey].beliefs));
        const stateUpdate = this.update(proposedUpdate, agentKey, this.state);
        this.state = Object.assign({}, this.state, stateUpdate);
      });
      this.history.push(this.state);
      this.render(this.state);
    };
    this.runner(run)(iterations);
    if (this.logHistory) return this.history;
  };
}
