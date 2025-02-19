# LLM Agent Example
This example implements a reasoning loop agent utilizing an LLM in the following scenario:
Our agent acts on behalf of a student who has forgotten to do their homework and aims to submit an
excuse request to the environment; the environment either accepts or rejects the request and gives
feedback regarding why a request was denied. As the student has several attempts to submit the
request, their agents adjusts the excuse request for previous attempts based on feedback that the
environment provides.

The implementation depends on unreleased changes in the main JS-son project. This means that as a
prerequisite, you have to navigate up to the main project root (`cd ../../`) and run `yarn install`.
Note that it is crucial to use `yarn`, as npm struggles with the transpilation settings for
asynchronous calls.

The example code integrates with Gemini, i.e. it requires a Gemini API key.
Install the example with `yarn install`, run it with `node index.js <API_TOKEN>`, where `<API_TOKEN>`
is your Gemini API token.
