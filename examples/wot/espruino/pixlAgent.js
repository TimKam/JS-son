/* eslint-disable-next-line no-use-before-define */
var Plan = Plan; var Agent = Agent;

var properties = {};
var sanitizedProperties = {};

global.Plans = [
  Plan(function (beliefs) { // show purge queue option as long as there is something to purge and temperature is high
    if (beliefs.queueLength && beliefs.queueLength > 0 && beliefs.temperature > 75) {
      return { showPurge: true };
    }
  }),
  Plan(function (beliefs) { // show stop option as long as robot is running and temperature is high
    return { showStop: beliefs.isRunning && beliefs.temperature > 75 };
  }),
  Plan(function (beliefs) { // provide an analysis of potential problems
    if (beliefs.temperature > 60 || beliefs.speed < 1) {
      const analysis = {
        urgency: 'urgent'
      };
      const speed = Math.round(beliefs.speed * 100) / 100;
      if (beliefs.temperature > 60 && speed < 1) {
        analysis.text =
        [`Robot is overheated (${beliefs.temperature}°C)`, '--> decreases speed'];
      } else if (beliefs.temperature > 60 && !speed < 1) {
        analysis.text =
        [`Robot is overheated (${beliefs.temperature}°C)`, 'does not decrease speed'];
        analysis.urgency = 'very_urgent';
      } else if (beliefs.temperature < 60 || speed < 1) {
        analysis.text =
        [`Robot is overheated (${beliefs.temperature}°C)`, 'but speed is slow'];
        analysis.urgency = 'medium';
      }
      render(analysis.text);
      LED1.set();
    } else {
      render(['Leubot-1: status okay']);
      LED1.reset();
    }
  })
];

const beliefs = {};

const uiAgent = new Agent('uiAgent', beliefs, [0, 1, 2]);

setInterval(function () {
  if (properties.temperature) {
    sanitizedProperties = properties;
  }
  const results = getProperties();
  uiAgent.next(results);
  console.log(properties);
  console.log(properties.isRunning);
}, 10000);

function getProperties () {
  return sanitizedProperties;
}

function render (texts) {
  g.clear();
  texts.forEach((text, index) => {
    g.drawString(text, (128 - g.stringWidth(text)) / 2, 20 + index * 10);
  });
  g.flip(true);
}
