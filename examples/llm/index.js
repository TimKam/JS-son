const { GoogleGenerativeAI } = require('@google/generative-ai')
const { Belief, Plan, Agent, Environment } = require('js-son-agent')

const genAI = new GoogleGenerativeAI(process.argv.slice(2)[0])
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

const beliefs = {
    ...Belief('rejectExps', []),
    ...Belief('excuseAccepted', false),
    ...Belief('name', 'Bart'),
    ...Belief('teacherName', 'Edna Krabappel')
}

const genPrompt = beliefs =>
`
Can you write a charming yet convincing excuse for a student who forgot their homework?
The names of teacher and student are ${beliefs.teacherName}, and ${beliefs.name},
respectively (i.e., sign the excuse with ${beliefs.name}).

Consider the following feedback received from past rejected excuses:

${beliefs.rejectExps.map(exp => `• ${exp}`).join('\n')}
`

const plans = [
    Plan(
        beliefs => !beliefs.excuseAccepted,
        async beliefs => {
            console.log('beliefs', beliefs)
            const prompt = genPrompt(beliefs)
            console.log('prompt', prompt)
            const excusePromise = await model.generateContent([prompt])
            const excuse = excusePromise.response.text()
            console.log('Excuse', excuse)
            return excuse
        }
    )
]

const reviseBeliefs = (beliefs, percepts) => {
    console.log('revise', beliefs, percepts)
    const rejectExps = percepts.rejectExp && !beliefs.rejectExps.includes(percepts.rejectExp) ?
        Array(...beliefs.rejectExps, percepts.rejectExp) :
        beliefs.rejectExps
    return percepts.excuseAccepted ? {
        ...beliefs,
        excuseAccepted: true,
    } : {
        ...beliefs,
        rejectExps
    }
}

const agent = new Agent({ id: 'student', beliefs, plans, reviseBeliefs })

const state = {
    excuseAccepted: false,
    rejectExp: ''
}

const updateState = async(actions, _, currentState) => {
    const excuse = await actions[0]
    if(!excuse)
        return { ...currentState, rejectExp: ''}
    const state = {
        excuseAccepted: false
    }
    if (['hamster', 'pigeon', 'pet', 'squirrel'].some(string => excuse.includes(string))) {
        state.rejectExp = 'The excuse must not refer to animals or pets.'
    } else if (['masterpiece'].some(string => excuse.includes(string))) {
        state.rejectExp = 'The excuse must not refer to homework as a piece of art.'
    }
    else if (['sister', 'Lisa'].some(string => excuse.includes(string))) {
        state.rejectExp = 'The excuse must not refer to your sister Lisa.'
    }
    else {
        state.excuseAccepted = true
    }
    console.log(
        state.excuseAccepted ?
            'Excuse accepted' :
            `Excuse rejected: ${state.rejectExp}`)
    console.log('-----')
    return state
}

const environment = new Environment(
    [agent],
    state,
    updateState
)

setInterval(() => environment.run(1), 3000)
