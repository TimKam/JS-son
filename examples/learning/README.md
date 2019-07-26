# Learning JS-son Agents

This tutorial describes how to implement *learning* JS-son agents in the environment we introduced in the [Grid World Tutorial](./arena/README.md).

## Prerequisites
In this tutorial, we extend the [Grid World/Arena](./arena/README.md) tutorial.
If you have not absolved the grid world tutorial, yet, follow it first and then get back to the learning tutorial.

## Dependencies
In addition to the dependencies that the basic grid world tutorial is using, we need the ``js-son-learning`` library, a JS-son extension that provides a simple API to develop learning agents:

```json
{
    "js-son-learning": "^0.0.1"
}
```

## Reward Design


* If an agent collects coins, it receives a reward that equals the amount of coins received.

* If an agent dies, it receives a reward of -100.

## Learning


## Running the Application
To run the application, execute ``npm run dev`` in the root directory of this example project.
Your browser will automatically open the application, which looks like this:

![JS-son: Arena example](js-son-arena.png)

To run the full build to generate files that can be deployed to a website run ``npm run build-prod``.



