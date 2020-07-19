# Web of Things Scripting API Integration
The [Web of Things (WoT) Scripting API](https://www.w3.org/TR/wot-scripting-api/) is an API specification draft for exposing, consuming and discovering *Things* (IoT devices) on the Web.
This project presents an example integration of JS-son and a WoT Scripting API implementation.
Running JS-son agents on Things can be useful because it constitutes a lightweight approach to instill goal-oriented behavior into Things (where the goal-driven program runs directly *on* a Thing).

## Example Scenario
The implementation presents the following (fictitious) example scenario.
We have a robot (agent) that takes items from an assembly line that is connected to a casting machine (thing) and packs them into boxes.
The robot can, at any time, configure the assembly line to run/the casting machine to produce faster or slower.
However, a faster running machine will heat up (and produce initially "hotter" items), which can have a negative impact on quality, *i.e.*, increase the scrap rate.
As a rough indication, the robot can check a thermometer (Thing) to check if the temperature of the machine exceeds "reasonable" levels.
Still, factors like further environmental conditions as well as the specific quality of the current badge of raw materials affect the quality in interaction with the temperature.
No information about these factors is available to the robot.
The robot can be configured to aim at not exceeding a specifiable scrap rate while maximizing production speed. 

## Implementation - TODO
We implement two "classical" things: a thermometer and a production line.
In addition, we implement one "agent" thing.
Using the W3C WoT terminology, we can refer to a thing as a *servient*.

### Thermometer Thing
This script implements a mock of a "thermometer" Thing that can be set to a specific base temperature and on request provide the temperature, which then roughly corresponds to the specified base temperature.

### Production Thing

### Robot Agent


## Running the example
Install ``@node-wot/core`` and ``js-son-agent`` as global dependencies:

```
npm install -g @node-wot/core js-son-agent
```

To run the example, start the servients by executing ``wot-servient`` on your command line.
