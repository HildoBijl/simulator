import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { usePrevious, selectRandomly } from '../../../util'
import { useUserId } from '../../../firebase'
import { Page } from '../../../components'
import { useSimulation, useSimulationIdFromUrl } from '../../../simulations'

import { Error } from '../../Error'

import { defaultAfterwards } from '../settings'
import { hasVariables, getInitialVariables, switchVariableNames, boundVariables, runUpdateScript, runCondition, getScriptError } from '../util'
import { getSimulationError, getGeneralSimulationError } from '../validation'

import { ErrorPage } from './ErrorPage'
import { StartPage } from './StartPage'
import { EndPage } from './EndPage'
import { Question } from './Question'

export function Simulation() {
	const { simulationUrl } = useParams()
	const id = useSimulationIdFromUrl(simulationUrl)
	if (id === null)
		return <Error />
	if (id === undefined)
		return <Page title="Simulation laden..." />
	return <SimulationWithId id={id} />
}

function SimulationWithId({ id }) {
	const simulation = useSimulation(id)

	// Upon a change of the URL by the simulation creator, update the URL in the browser too.
	const url = simulation?.url
	const previousUrl = usePrevious(url)
	useEffect(() => {
		if (previousUrl)
			window.history.pushState({}, undefined, `/s/${url}`)
	}, [previousUrl, url])


	// On a loading or erroneus simulation, show the right notification.
	if (simulation === null) // Failed to load.
		return <Error />
	if (simulation === undefined) // Loading.
		return <Page title="Simulation laden..." />

	// We have a valid simulation! Render it! Add a key to assure a reload on a change of simulation.
	return <SimulationWithData key={simulation.id} simulation={simulation} />
}

const initialSimulationState = { questionCounter: 0 }
function SimulationWithData({ simulation }) {
	// Define the simulation state.
	const [state, setState] = useState(initialSimulationState)
	const [error, setError] = useState(false) // Tracks if an error was encountered during simulation run-time.
	const { questionId, questionCounter } = state
	console.log(state)

	// Define handlers.
	const handlers = useSimulationHandlers(simulation, setState, setError)
	const { start, reset, chooseOption, goToNextQuestion } = handlers

	// Check for an error in the simulation. Only display it if something actually failed. (Or directly for the owner.)
	const simulationError = useMemo(() => getSimulationError(simulation), [simulation])
	useEffect(() => {
		if (error && !simulationError)
			setError(false)
	}, [error, simulationError])
	const userId = useUserId()
	const isOwner = simulation.owners.includes(userId)
	if (simulationError && (error || isOwner)) // Faulty simulation.
		return <ErrorPage simulation={simulation} error={simulationError} />

	// When there's no question yet, we're on the start page.
	if (!questionId)
		return <StartPage {...{ simulation, state, start, setError }} />
	if (questionId === 'end')
		return <EndPage {...{ simulation, state, reset }} />
	return <Question key={questionCounter} {...{ simulation, state, chooseOption, goToNextQuestion, setError }} />
}

// useSimulationHandlers takes a simulation and its state and gives various functions used to control that state.
function useSimulationHandlers(simulation, setState, setError) {
	// reset will put the simulation back into its initial state with nothing defined.
	const reset = useCallback(() => {
		setState(initialSimulationState)
	}, [setState])

	// start will initialize the simulation, setting stuff like questions and variables to their (possibly partly randomized) initial values.
	const start = useCallback(() => {
		// Check for potential general errors.
		if (getGeneralSimulationError(simulation))
			return setError(true)

		// Initialize the state.
		setState(state => ({
			...state,
			questionId: simulation.startingQuestion || simulation.questions[0],
			variables: getInitialVariables(simulation),
		}))
	}, [simulation, setState, setError])

	// chooseOption will pick an option for the current question.
	const chooseOption = useCallback((index) => {
		// Check for potential general errors.
		if (getGeneralSimulationError(simulation))
			return setError(true)

		// Update the state.
		setState(state => {
			// Check if an option input is possible.
			const { questionId, questionDone, variables } = state
			if (questionDone)
				throw new Error(`Invalid option choice: the question already has been finished.`)

			// Extract required data.
			const question = simulation.questions[questionId]
			const options = question.options || []

			// Check if the given option is valid.
			if (index !== undefined && (index < 0 || index >= options.length))
				throw new Error(`Invalid option choice: tried to choose option ${index} of a question, but the question only has ${options.length} options available. (Indices are zero-starting.)`)
			const option = options[index]

			// Set up the new state.
			const newState = {
				...state,
				questionDone: true,
				choice: index,
			}

			// On variables, run all relevant update scripts, assuming they exist.
			if (hasVariables(simulation) && (option.updateScript || question.updateScript || simulation.updateScript)) {
				// Check said update scripts first.
				if (getScriptError(option.updateScript || question.updateScript, simulation) || getScriptError(simulation.updateScript, simulation)) {
					setError(true)
					return state
				}

				// Run the update scripts on the variables.
				let variablesAsNames = switchVariableNames(variables, simulation)
				variablesAsNames = runUpdateScript(variablesAsNames, option.updateScript || question.updateScript)
				variablesAsNames = boundVariables(variablesAsNames, simulation.variables)
				variablesAsNames = runUpdateScript(variablesAsNames, simulation.updateScript)
				variablesAsNames = boundVariables(variablesAsNames, simulation.variables)
				newState.variables = switchVariableNames(variablesAsNames, simulation, true)
			}

			// All done!
			return newState
		})
	}, [simulation, setState, setError])

	// goToNextQuestion will go to the next question depending on the (confirmed) selected question option.
	const goToNextQuestion = useCallback(() => {
		setState(state => {
			// If the question has options, but no option has been selected and confirmed, we're not ready yet to move on.
			const { questionId, questionDone, choice, variables } = state
			const question = simulation.questions[questionId]
			const options = question.options || []
			if (options.length > 0 && (choice === undefined || !questionDone))
				throw new Error(`Invalid nextQuestion request: no option has been selected/confirmed for the given state yet. Cannot go to the next question.`)

			// Determine the next question: either the follow-up for the chosen option, the follow-up for the given question, the next question in the order, or (if not existing) the end.
			let nextQuestionId = (options[choice] && options[choice].followUpQuestion) || question.followUpQuestion || simulation.questionOrder[simulation.questionOrder.indexOf(question.id) + 1] || 'end'
			let jumpQuestionId = state.jumpQuestionId // Where to jump to when an event is done.

			// Check for events: find all events that did not fire before, but do fire now. On multiple, select one randomly.
			let experiencedEvents = state.experiencedEvents || []
			const variablesAsNames = switchVariableNames(variables, simulation)
			const triggeredEvents = Object.values(simulation.events).filter(event => !experiencedEvents.includes(event.id) && runCondition(variablesAsNames, event.condition))
			if (triggeredEvents.length > 0) {
				const triggeredEvent = selectRandomly(triggeredEvents)
				experiencedEvents = [...experiencedEvents, triggeredEvent.id]
				const afterwards = triggeredEvent.afterwards || defaultAfterwards
				if (afterwards === 'originalFollowUp') {
					jumpQuestionId = jumpQuestionId || nextQuestionId // Store the original follow-up as jump-back, unless one already existed, then keep that.
				} else if (afterwards === 'eventFollowUp') {
					jumpQuestionId = undefined // Don't store (and even delete) any original jump-back.
				} else {
					throw new Error(`Invalid event-afterwards setting: have not implemented the setting "${afterwards}" yet.`)
				}
				nextQuestionId = triggeredEvent.question
			} else {
				// If there was a jump-back question defined, jump back to it.
				if (jumpQuestionId) {
					nextQuestionId = jumpQuestionId
					jumpQuestionId = undefined
				}
			}

			// Set up the new state with the next question.
			const newState = {
				...state,
				questionId: nextQuestionId,
				questionCounter: state.questionCounter + 1,
				jumpQuestionId,
				experiencedEvents,
			}
			delete newState.choice
			delete newState.questionDone
			return newState
		})
	}, [simulation, setState])

	// All handlers are ready!
	return { reset, start, chooseOption, goToNextQuestion }
}
