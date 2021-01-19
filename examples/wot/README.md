# Web of Things Scripting API Integration
The [Web of Things (WoT) Scripting API](https://www.w3.org/TR/wot-scripting-api/) is an API specification draft for exposing, consuming and discovering *Things* (IoT devices) on the Web.
This project presents an example integration of JS-son and a WoT Scripting API implementation (AAMAS 2021 demonstration).
One JS-son agent runs directly on the WOT Scripting API gateway, controlling an industrial robot arm.
Anther JS-son agent runs remotely on a constraint device. The agents interact with each other, as well as with some *Things* (sensors) in their environment.

## Example Scenario
In a factory, products are assembled *just-in-time* to save space and to better support individual product configuration requests by customers.
When an order is received, an autonomous robot (agent) configures the manufacturing line to produce any custom parts that are not in stock and then assembles and packs the product(s).
In this process, the robot has to keep track of some sensors (things) that inform it about its attainment of different goals, *i.e.*, to keep the assembly line from jamming or overheating and to avoid harming any human worker who may be on the production floor, while assembling the products with as little delay as possible.
Human workers that are on the production floor receive guidance by small, low-power displays that host programs (agents) to guide the humans if necessary (and which, for example, still work in case of a power outage).

The robot (agent) runs directly on a WoT Scripting API gateway.
Several thing descriptions provide interfaces to remote sensors.
The guide agent runs on a constrained ([Espruino](http://www.espruino.com/)) device.


## Setup
To configure the demonstration, go to the project's root directory, open the ``config`` folder and create a file named ``config.js``.
Add the following lines of code to the file:

```JavaScript
const robotUrl = '<robotUrl>'

const user = {
  name: '<name>',
  email: '<email>'
}

const gatewayUrl = '<gatewayUrl>'

module.exports = { url, user }
```
Note that you should replace:

* ``<robotUrl>`` with the url to a [leubot](https://github.com/Interactions-HSG/leubot)-enabled PhantomX AX-12 Reactor Robot Arm.

* ``<name>`` with the name of the user that is to be registered at the leubot interface. 

* ``<email>`` with the email address of the user that is to be registered.

* ``<gatewayUrl>`` with the url at which your WoT Scripting API gateway is available.

Then, go back to the project's root directory and install the project's dependencies:

```
npm install
```

To run the example, start the servient by executing ``npm run start`` on your command line.

## Usage
To discover the things and agents that the servient exposes, open the WoT Scripting API Gateway, *e.g.*, at `http://127.0.0.1:8080`.
Navigating the gateway interface allows you (or any other human or AI agent) to discover all ways of interacting with our multi-agent system.
Below are some examples (assuming `http://127.0.0.1:8080` as the gateway URL):

* Add a new item of configuration ``A`` to the robot's queue (which in turns triggers the robot to perform movements that mock the assembly of the item, if the robot is running and no other items are waiting to be processed before): `curl --location --request POST 'http://127.0.0.1:8080/robot/actions/addToQueue?configuration=A&id=3'`

* Triggering action sensor ``A`` (which in turn adds a new item of configuration ``A`` to the robot's queue): `curl --location --request POST 'http://127.0.0.1:8080/action_sensor_a/actions/triggerAssembly'`

## Advanced Setup - Espruino Device Integration
This project provides code that can be used to integrate [Espruino](https://www.espruino.com) devices into our WoT setup.
To achieve this, proceed as follows.

Create a ``config.js`` in the ``espruino`` directory of the project. Add the following content:

  ```JavaScript
  var gatewayUrl = '<gatewayUrl>'
  ```

Replace ``<gatewayUrl>`` with the url at which your WoT Scripting API gateway is available.

Install the Node.js ``http-server`` module globally: ``npm install -g http-server``.
Then, run ``http-server ./espruino -p=8081``.

## Advanced Usage - Espruino Device Integration
Open ``http://127.0.0.1:8081``.
From there, you can deploy things and agents to Esprunio [Puck.js](http://www.espruino.com/Puck.js) and [Pixl.js](http://www.espruino.com/Pixl.js) devices, respectively.
Also, the web interface at ``http://127.0.0.1:8081`` hosts an agent that monitors the leubot robot.


