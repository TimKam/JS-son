# Edge JS-son
This tutorial shows how to run JS-son Multi-Agent Systems (MAS) on constrained devices, in
particular on microcontrollers that run the [Espruino](https://www.espruino.com/) JavaScript
interpreter. We first optimize JS-son for better performance on Espruino devices and then implement
a small running example of a multi-agent system on the [Pixl.js](http://www.espruino.com/Pixl.js).

## JS-son Optimization
JS-son is a very small library. Its minimally viable core, *i.e.*, the JavaScript code that is
absolutely necessary to run a JS-son MAS, contains at the time of writing around 225 lines of code,
written in *Vanilla* JavaScript, without requiring any additional dependencies. Still, it is
possible to further improve the core code for execution on constrained devices, in particular to
reduce the space a running JS-son MAS occupies in a microcontroller's RAM.
In particular, we adjust the JS-son core code as follows:

* We change the code style to follow the
  [recommendations of Espruino](http://www.espruino.com/Code+Style).

* We only support belief-plan deliberation and not full belief-desire-intention-plan deliberation.

* We remove some automated type checks for beliefs that require extensive parsing.

* We remove abstractions for agent-to-agent messaging.

* We refactor code that uses JavaScript features not supported by Espruino.

* We change the *plan* abstraction of an agent: an agent has exactly one plan, which is always
  active (does not have a head, but just a body). The plan can be any JavaScript function, *i.e.*,
  several planning objectives can be accomplished. 

* We manage plans in a global plans library; the plan of each agent is in fact a pointer to a plan
in this library.

* We add a configuration variable for the environment that deactivates storing the MAS's history
  by default.

The code of *Edge JS-son*, the JS-son version that is optimized for constrained devices, is
available [here](./EdgeJSson.js).

## Example Implementation
With these improvements, it is possible to run a simple MAS on the Pixl.js
Espruino device. As an example, we implement a MAS that is similar to the
[Jason Room MAS](https://github.com/jason-lang/jason/tree/master/examples/room).

Most of the example is implemented analogously to the most basic *JS-son*
[belief-plan tutorial](https://github.com/TimKam/JS-son#belief-plan-approach).
An important difference are changes to the ``updateState`` and ``render`` functions:

* The ``updateState`` also constructs an object that is the basis for the Pixl.js-specific render
  function:

  ```JavaScript
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
  ```

* The ``render`` function implements Pixl.js-specific rendering:

  ```JavaScript
  function render (state) {
    g.clear();
    Object.keys(state.actions).forEach(function (agentId) {
      const message = `${agentId}: ${state.actions[agentId]}`;
      g.drawString(message, (128 - g.stringWidth(message)) / 2, 20 + agentId * 10);
    });
    g.flip(true);
  }
  ```

## Deployment and Execution
To deploy and execute Edge JS-son, we proceed as follows:

1. We open the [Espruino Web IDE](https://www.espruino.com/ide/) and connect to our Pixl.js device
   via BlueTooth as described in the
   [Pixl.js Getting Stared Tutorial](http://www.espruino.com/Quick+Start+BLE#pixljs).

2. We copy the code of [Edge JS-son](./EdgeJSson.js), as well as the code of the *room* example,
   paste it into the Web IDE, and click the **Send to Espruino** button.

We're done, the *room* MAS runs on the Espruino.

## Running a Distributed MAS
Next, let us adjust the MAS so that it runs distributed, with two agents (and the environment) on
the Pixl.js and one agent in our web browser.
For this, we can conveniently rely on the following:

* Espruino supports
  [interacting with a web browser via Web Bluetooth](https://www.espruino.com/Web%20Bluetooth).
  We have already used this feature when deploying our code; we can also using it write code that
  sends messages to a JavaScript application that runs on our browser.

* [Another JS-son tutorial](https://github.com/TimKam/JS-son/tree/master/examples/distributed)
  already shows how to implement the *room* MAS in a distributed manner; we can learn from this
  example, and merely need to apply the same approach to a different set of technologies.

We start by creating a simple HTML page that contains a button to deploy part of the MAS to the
Pixl.js Espruino device. The same page will execute one of the MAS' agents:

```html
<html>
 <head>
   <style>
     body { margin:0;  }
     h1 {
       display:block;;
       margin: auto;
       width: 50%;
       padding: 10px;
     }
     button#deploy, div.console {
       display:block;;
       margin: auto;
       width: 20%;
       padding: 10px;
     }
     div.console {
       display:block;;
       margin: auto;
       padding: 10px;
     }
   </style>    
 </head>
 <body>
   <h1>Espruino - Distributed Multi-Agent System Demo</h1>
   <button id="deploy">Deploy to Pixl.js</button> <br><br>
   <div class="console" ><strong>Open console to view log.</strong></div>
  <script src="https://www.puck-js.com/puck.js"></script>
  <script src="./EdgeJSson.js"></script>
  <script src="./client.js"></script>
 </body>
</html>
```

...

Before we can run the MAS, we need to globally install the ``http-server`` npm package:

```
npm install -g http-server
```

This allows us to run the web application as if it was hosted by a web server; otherwise, some of
the features our application uses would be blocked by the browser's security functionality.

We start the web application by running ``http-server`` in the root directory. Open
``http://127.0.0.1:8080`` and click the **Deploy to Pixl.js** button. Once you have deployed the
code, open your browser's console and see the MAS's logs being printed out. More concise messages
are printed to the Pixl.js screen.


