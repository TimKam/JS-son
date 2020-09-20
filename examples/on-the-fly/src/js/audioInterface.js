// snyth sounds somewhat based on the the following tutorial:
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth

import { detect } from '@tonaljs/chord-detect'

const getNoteFrequency = node => {
  const mapping = {
    'A': 110.00,
    'A#': 116.54,
    'B': 123.47,
    'C': 130.81,
    'C#': 138.59,
    'D': 146.83,
    'D#': 155.56,
    'E': 164.81,
    'F': 174.61,
    'F#': 185.00,
    'G': 196.00,
    'G#': 207.65
  }
  return mapping[node]
}

const getNoteForKey = key => {
  const mapping = {
    'a': 'A',
    'w': 'A#',
    's': 'B',
    'd': 'C',
    'r': 'C#',
    'f': 'D',
    't': 'D#',
    'g': 'E',
    'h': 'F',
    'u': 'F#',
    'j': 'G',
    'i': 'G#'
  }
  return mapping[key]
}

// maintain array of currently "active" notes
let notes = []

const playTone = (frequency, masterGainNode, audioContext) => {
  const oscillator = audioContext.createOscillator()
  oscillator.connect(masterGainNode)
  oscillator.type = 'square'
  oscillator.frequency.value = frequency
  oscillator.start()
  return oscillator
}

const audioInterface = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  let oscillatorDictionary = {}
  const masterGainNode = audioContext.createGain()
  masterGainNode.connect(audioContext.destination)

  window.addEventListener('keydown', event => {
    const note = getNoteForKey(event.key)
    if (note) {
      notes.push(note)
      const frequency = getNoteFrequency(note)
      console.log(note, frequency)
      const chord = detect(notes)[0] ? detect(notes)[0] : 'none'
      console.log(notes, chord)
      if (chord !== 'none') {
        let currentScript = window.editor.getValue()
        console.log(currentScript)
        console.log(chord[1])
        if (chord[1] === 'M') {
          currentScript = currentScript.replace(
            '(isActive && neighborActivity >= 2 && neighborActivity < 4)',
            '(isActive && neighborActivity >= 1 && neighborActivity < 4)'
          )
          currentScript = currentScript.replace(
            'neighborActivity === 3',
            '(neighborActivity === 0 && Math.random() < 0.5)'
          )
        } else if (chord[1] === 'm') {
          currentScript = currentScript.replace(
            '(isActive && neighborActivity >= 1 && neighborActivity < 4)',
            '(isActive && neighborActivity >= 2 && neighborActivity < 4)'
          )
          currentScript = currentScript.replace(
            '(neighborActivity === 0 && Math.random() < 0.5)',
            'neighborActivity === 3'
          )
        }
        setTimeout(() => {
          window.editor.setValue(currentScript)
          window.editor.pushEditOperations()
        }, 1000)
      }
      if (oscillatorDictionary[note]) {
        oscillatorDictionary[note].stop()
      }
      oscillatorDictionary[note] = playTone(frequency, masterGainNode, audioContext)
    }
  })

  window.addEventListener('keyup', event => {
    const note = getNoteForKey(event.key)
    if (note) {
      if (notes.includes(note)) {
        notes = []
      }
      if (oscillatorDictionary[note]) {
        oscillatorDictionary[note].stop()
      }
    }
  })
}

export default audioInterface
