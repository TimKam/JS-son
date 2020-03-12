# Distributed JS-son
This example (based on the
[Jason room](https://github.com/jason-lang/jason/tree/master/examples/room) example) demonstrates
how to implement distributed multi-agent systems with JS-son.

In the example, three agents are in room (the environment).
The only objects the agents can possibly interact with is the room's door.
Each agent is of a different type:

* The first agent is a **porter**. It is the only agent that is capable of opening and closing the
  door and does so if any other agent issues a corresponding request.

* The second agent is a **paranoid**. If the door is open, the paranoid asks the porter to close the
  door; after the porter has closed the door, the paranoid agent broadcasts a "Thank you!" message.

* The third agent is a **claustrophobe**. If the door is closed, the claustrophobe asks the porter
  to open the door; after the porter has opened the door, the claustrophobe agent broadcasts a
  "Thank you!" message.

The multi-agent system is distributed across three nodes (Node.js servers):

* The main node--``mas.js``--hosts the environment and the porter.

* ``paranoid.js`` hosts the paranoid agent.

* ``claustrophobe.js`` hosts the claustrophobe agent.





