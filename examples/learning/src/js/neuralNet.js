import * as tensorflow from '@tensorflow/tfjs'

const optimizer = tensorflow.train.adam(1e-3)

const activation = 'relu'

const createNetwork = (height, width, numActions) => {
  if (!(Number.isInteger(height) && height > 0)) {
    throw new Error(`Expected height to be a positive integer, but got ${height}`)
  }
  if (!(Number.isInteger(width) && width > 0)) {
    throw new Error(`Expected width to be a positive integer, but got ${width}`)
  }
  if (!(Number.isInteger(numActions) && numActions > 1)) {
    throw new Error(`Expected numActions to be a integer greater than 1, but got ${numActions}`)
  }

  const model = tensorflow.sequential()
  model.add(tensorflow.layers.conv2d({
    filters: 128,
    kernelSize: 3,
    strides: 1,
    activation,
    inputShape: [height, width, 2]
  }))
  model.add(tensorflow.layers.batchNormalization())
  model.add(tensorflow.layers.conv2d({
    filters: 256,
    kernelSize: 3,
    strides: 1,
    activation
  }))
  model.add(tensorflow.layers.batchNormalization())
  model.add(tensorflow.layers.conv2d({
    filters: 256,
    kernelSize: 3,
    strides: 1,
    activation
  }))
  model.add(tensorflow.layers.flatten())
  model.add(tensorflow.layers.dense({ units: 100, activation }))
  model.add(tensorflow.layers.dropout({ rate: 0.25 }))
  model.add(tensorflow.layers.dense({ units: numActions }))

  return model
}

const getStateTensor = (state, height, width) => {
  if (!Array.isArray(state)) {
    state = [state]
  }
  const numExamples = state.length
  const buffer = tensorflow.buffer([numExamples, height, width, 2])

  return buffer.toTensor()
}

const trainOnReplayBatch = (gamma, optimizer, memory, policy) => {
  const lossFunction = () => tensorflow.tidy(() => {
    const stateTensor = getStateTensor(
      memory.map(example => example[0]), 20, 20)
    const actionTensor = tensorflow.tensor1d(
      memory.map(example => example[1]), 'int32')
    const qs = policy.apply(stateTensor, { training: true })
      .mul(tensorflow.oneHot(actionTensor, 4)).sum(-1)
    const rewardTensor = tensorflow.tensor1d(memory.map(example => example[2]))
    const nextStateTensor = getStateTensor(
      memory.map(example => example[4]), 20, 20)
    const nextMaxQTensor = policy.predict(nextStateTensor).max(-1)
    const doneMask = tensorflow.scalar(1).sub(
      tensorflow.tensor1d(memory.map(example => example[3])).asType('float32'))
    const targetQs =
      rewardTensor.add(nextMaxQTensor.mul(doneMask).mul(gamma))
    return tensorflow.losses.meanSquaredError(targetQs, qs)
  })

  const grads = tensorflow.variableGrads(lossFunction, policy.getWeights())
  optimizer.applyGradients(grads.grads)
  tensorflow.dispose(grads)
  return policy
}

const determineAction = (transformedState, actionMapping, network) => {
  let action
  tensorflow.tidy(() => {
    const stateTensor = getStateTensor(
      transformedState,
      20,
      20
    )
    action = actionMapping[network.predict(stateTensor).argMax(-1).dataSync()[0]]
  })
  return action
}

export { createNetwork, trainOnReplayBatch, optimizer, determineAction }
