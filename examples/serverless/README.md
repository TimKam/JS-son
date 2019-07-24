# Serverless JS-son

[Serverless](https://en.wikipedia.org/wiki/Serverless_computing) computing is a current trend in software provisioning that allows application developers to deploy their application back ends as simple functions to a service provider's highly available and scalable IT infrastructure.
An alternative term that describes the same concept is *function-as-a-service*.
This tutorial describes how to deploy a JS-son multi-agent system as a [Google Cloud Function](https://cloud.google.com/functions/).

## Prerequisites
To follow this tutorial, you need to have Google Cloud Functions set up and configured as described in the [Before you begin](https://cloud.google.com/functions/docs/quickstart-nodejs#before-you-begin) section of Google Cloud Function's Node.js *quick start* documentation page.
Also, install the [Google Cloud SDK](https://cloud.google.com/sdk/).

## Implementation
To implement a JS-son multi-agent system (or single JS-son agent) as a serverless function, create a new directory on your local machine as your function's root directory and then proceed as follows:

1. Create a ``package.json`` file in the root directory. Minimally adjust the Google Cloud Function [boilerplate package.json](https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/master/functions/helloworld/package.json) to reflect your project's name, license, and author, as well as to list ``js-son-agent`` and other potential dependencies:

  ```JSON
  {
    "name": "serverless-js-son",
    "version": "0.0.1",
    "private": true,
    "license": "BSD-2-Clause",
    "author": "TImotheus Kampik",
    "engines": {
      "node": ">=8.0.0"
    },
    "scripts": {
      "e2e-test": "export FUNCTIONS_CMD='gcloud functions' && sh test/updateFunctions.sh && BASE_URL=\"https://$GCP_REGION-$GCLOUD_PROJECT.cloudfunctions.net/\" mocha test/*.test.js --timeout=60000 --exit",
      "test": "export FUNCTIONS_CMD='functions-emulator' && sh test/updateFunctions.sh && export BASE_URL=\"http://localhost:8010/$GCLOUD_PROJECT/$GCF_REGION\" && mocha test/*.test.js --timeout=60000 --exit",
      "system-test": "export FUNCTIONS_CMD='functions-emulator' && sh test/updateFunctions.sh && export BASE_URL=\"http://localhost:8010/$GCLOUD_PROJECT/$GCF_REGION\" && mocha test/*.test.js --timeout=60000 --exit"
    },
    "dependencies": {
      "@google-cloud/debug-agent": "^4.0.0",
      "js-son-agent": "^0.0.5"
    },
    "devDependencies": {
      "@google-cloud/nodejs-repo-tools": "^3.3.0",
      "@google-cloud/pubsub": "^0.28.0",
      "@google-cloud/storage": "^2.0.0",
      "mocha": "^6.0.0",
      "express": "^4.16.3",
      "proxyquire": "^2.1.0",
      "sinon": "^7.0.0",
      "supertest": "^4.0.0",
      "uuid": "^3.1.0",
      "yargs": "^13.0.0"
    },
    "cloud-repo-tools": {
      "requiresKeyFile": true,
      "requiresProjectId": true,
      "requiredEnvVars": [
        "BASE_URL",
        "GCLOUD_PROJECT",
        "GCF_REGION",
        "FUNCTIONS_TOPIC",
        "FUNCTIONS_BUCKET",
        "FUNCTIONS_CMD"
      ]
    }
  }
  ```

2. Create a ``.cloudignore`` file that specifies what content in the project directory should *not* be uploaded to Google Cloud Functions:

  ```
  .gcloudignore
  .git
  .gitignore

  node_modules
  ```

3. Create the main file--``index.js``. Import the JS-son dependencies and specify a request handler.

  ```JavaScript
  'use strict'

  const {
    Belief,
    Desire,
    Plan,
    Agent,
    Environment
  } = require('js-son-agent')

  /**
   * HTTP Cloud Function.
   *
   * @param {Object} req Cloud Function request context.
   *                     More info: https://expressjs.com/en/api.html#req
   * @param {Object} res Cloud Function response context.
   *                     More info: https://expressjs.com/en/api.html#res
   */
  exports.simulate = (req, res) => {
    if (!(req.query.bias && req.query.ticks)) {
      res.status(400)
      res.send(`Your query: ${JSON.stringify(req.query)}. Please specify bias and number of ticks`)
    }
    // TODO
  }
  ```

4. Implement the multi-agent system. 
   In our example, we implement the belief spread simulation as described in the [data science tutorial](https://github.com/TimKam/JS-son/blob/master/examples/jupyter/JS-son_Data_Science_Demo.ipynb).
   We wrap the belief spread simulation into a stateless function that can be called with the parameters ``bias`` (a higher bias leads to a stronger facilitation of ``true`` beliefs) and ``ticks`` (specifying the length of the simulation run). The code for the whole function is available [here](https://github.com/TimKam/JS-son/blob/master/examples/serverless/index.js).

  ```JavaScript
    /**
    * HTTP Cloud Function.
    *
    * @param {Number} bias The higher the bias, the stronger the facilitation of ``true`` announcements
    * @param {Number} ticks Amount of ticks the simulation should run
    */
    function run(bias, ticks) {
      // add multi-agent simulation here
      const result = // assign simulation result here
      return result
    }
  ```


4. Call the multi-agent system from the request handler:


  ```JavaScript
  exports.simulate = (req, res) => {
    if (!(req.query.bias && req.query.ticks)) {
      res.status(400)
      res.send(`Your query: ${JSON.stringify(req.query)}. Please specify bias and number of ticks`)
    }
    res.send(run(bias, ticks))
  }
  ```

## Deployment
Deploy the code with ``gcloud functions deploy belief-spread --entry-point simulate --runtime nodejs8 --trigger-http``.
The deployment might take some minutes.
After the function has been deployed successfully, you will receive a message on your command prompt that describes the most important properties of the newly deployed end point.
Copy the value of the ``httpsTrigger``/ ``url`` property, e.g. ``https://us-central1-empty-acolyte-230022.cloudfunctions.net/belief-spread``.
Below, we will refer to this value as ``<trigger>``.

## Usage
After the function has been deployed, you can trigger it by sending an ``HTTP GET`` request to the trigger URL the deployment command returned.
You need to specify the parameters ``bias`` and ``ticks``:

```
curl -X GET '<trigger>/simulate?ticks=<ticksValue>&bias=<biasValue>'
```

For example, the request can look like this (note that this example request does not refer to an actually existing endpoint):

```
curl -X GET 'https://us-central1-empty-acolyte-230022.cloudfunctions.net/belief-spread/simulate?ticks=20&bias=5'
```

