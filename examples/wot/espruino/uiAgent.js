/* eslint-disable-next-line no-use-before-define */
var Plan = Plan; var Agent = Agent; var properties;

const plans = [
  Plan(function (beliefs) { // show purge queue option as long as there is something to purge and temperature is high
    if (beliefs.queue && beliefs.queue.length > 0 && beliefs.temperature > 75) {
      return { showPurge: true };
    }
  }),
  Plan(function (beliefs) { // show stop option as long as robot is running and temperature is high
    return { showStop: beliefs.isRunning && beliefs.temperature > 75 };
  }),
  Plan(function (beliefs) { // provide summary of robot status
    if (beliefs.isRunning) {
      const speed = Math.round(beliefs.speed * 100) / 100;
      const overview = {
        temperature: beliefs.temperature,
        speed: speed,
        queueLength: beliefs.queue.length,
        historyLength: beliefs.assemblyHistory.length
      };
      return { overview };
    }
  }),
  Plan(function (beliefs) { // provide an analysis of potential problems
    if (beliefs.temperature > 60 || beliefs.speed < 1) {
      const analysis = {
        urgency: 'urgent'
      };
      const speed = Math.round(beliefs.speed * 100) / 100;
      if (beliefs.temperature > 60 && speed < 1) {
        analysis.text =
        `The robot is overheated (${beliefs.temperature}°C), and has reacted by decreasing its speed (speed: ${speed}).`;
      } else if (beliefs.temperature > 60 && !speed < 1) {
        analysis.text =
        `The robot is overheated (${beliefs.temperature}°C), but is not decreasing its speed (speed: ${speed}).`;
        analysis.urgency = 'very_urgent';
      } else if (beliefs.temperature < 60 || speed < 1) {
        analysis.text =
        `The robot is not overheated (${beliefs.temperature}°C), but runs at slow speed (speed: ${speed}).`;
        analysis.urgency = 'medium';
      }
      return { analysis };
    }
  })
];

if (window) {
  window.Plans = plans;
}
global.Plans = plans;

const beliefs = {};

const uiAgent = new Agent('uiAgent', beliefs, [0, 1, 2, 3]);

setInterval(function () {
  getProperties().then(function (results) {
    const agentFeedback = uiAgent.next(results);
    render(agentFeedback);
  });
}, 1000);

async function requestPurge () {
  const response = await fetch(`${gatewayUrl}/robot/actions/purgeQueue`, {
    method: 'POST',
    mode: 'cors'
  });
  return response;
}

async function stopRobot () {
  const response = await fetch(`${gatewayUrl}/robot/actions/stop`, {
    method: 'POST',
    mode: 'cors'
  });
  return response;
}

async function getProperty (agentName, propertyName) {
  const response = await fetch(`${gatewayUrl}/${agentName}/properties/${propertyName}`, {
    method: 'GET',
    mode: 'cors'
  });
  return response;
}

async function getProperties () {
  return Promise.allSettled(
    [
      getProperty('robot', 'isRunning'),
      getProperty('robot', 'speed'),
      getProperty('robot', 'queue'),
      getProperty('robot', 'assemblyHistory'),
      getProperty('thermometer', 'temperature')
    ]).then(async values => {
    const beliefUpdate = {
      isRunning: await values[0].value.json(),
      speed: await values[1].value.json(),
      queue: await values[2].value.json(),
      assemblyHistory: await values[3].value.json(),
      temperature: await values[4].value.json()
    };
    properties = {
      isRunning: beliefUpdate.isRunning,
      speed: beliefUpdate.speed,
      queueLength: beliefUpdate.queue.length,
      temperature: beliefUpdate.temperature
    };
    return beliefUpdate;
  });
}

function render (state) {
  const overviewObject = state.find(item => item && item.overview);
  if (overviewObject) {
    const overview = overviewObject.overview;
    document.getElementById('summary-div').innerHTML = `
    <div class="summary-item"><strong>Temperature: </strong> ${overview.temperature} °C</div>
    <div class="summary-item"><strong>Speed: </strong> ${overview.speed}</div>
    <div class="summary-item"><strong>Length of queue: </strong> ${overview.queueLength}</div>
    <div class="summary-item"><strong>#Items assembled: </strong> ${overview.historyLength}</div>
  `;
  }
  const analysisObject = state.find(item => item && item.analysis);
  if (analysisObject) {
    const analysis = analysisObject.analysis;
    document.getElementById('analysis-div').innerHTML = `<div class="analysis ${analysis.urgency}">${analysis.text}</div>`;
  }
  const showPurge = state.find(item => item && item.showPurge);
  if (showPurge) {
    document.getElementById('purge').className = '';
  } else {
    document.getElementById('purge').className = 'hidden';
  }
  const showStop = state.find(item => item && item.showStop);
  if (showStop) {
    document.getElementById('stop').className = '';
  } else {
    document.getElementById('stop').className = 'hidden';
  }
  if (!(showPurge || showStop)) {
    document.getElementById('recommendation-heading').className = 'hidden';
  } else {
    document.getElementById('recommendation-heading').className = '';
  }
}
