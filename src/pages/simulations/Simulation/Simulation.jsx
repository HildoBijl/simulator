import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { usePrevious, selectRandomly } from '../../../util'
import { useUserId } from '../../../firebase'
import { Page } from '../../../components'
import { useSimulation, useSimulationIdFromUrl } from '../../../simulations'

import { Error } from '../../Error'

import { defaultAfterwards } from '../settings'
import { getState, hasVariables, getInitialVariables, switchVariableNames, boundVariables, runUpdateScript, runCondition, getScriptError } from '../util'
import { getSimulationError, getGeneralSimulationError, getSimulationEventError } from '../validation'

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

function SimulationWithData({ simulation }) {
	// Define the simulation state.
	const [history, setHistory] = useState([])
	const [error, setError] = useState(false) // Tracks if an error was encountered during simulation run-time.
	const state = getState(history)
	const { questionId } = state

	// Define handlers.
	const handlers = useSimulationHandlers(simulation, setHistory, setError)
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
	return <Question key={history.length - 1} {...{ simulation, state, chooseOption, goToNextQuestion, setError }} />
}

// useSimulationHandlers takes a simulation and its state and gives various functions used to control that state.
function useSimulationHandlers(simulation, setHistory, setError) {
	// reset will put the simulation back into its initial state with nothing defined.
	const reset = useCallback(() => {
		setHistory([])
	}, [setHistory])

	// start will initialize the simulation, setting stuff like questions and variables to their (possibly partly randomized) initial values.
	const start = useCallback(() => {
		// Check for potential general errors.
		if (getGeneralSimulationError(simulation))
			return setError(true)

		// Initialize the state.
		setHistory(history => {
			if (history.length !== 0)
				throw new Error(`Cannot start simulation: it has already been started.`)
			const state = {
				questionId: simulation.startingQuestion || simulation.questions[0],
			}
			if (hasVariables(simulation))
				state.variables = getInitialVariables(simulation)
			return [state.variables || {}, state]
		})
	}, [simulation, setHistory, setError])

	// chooseOption will pick an option for the current question.
	const chooseOption = useCallback((index) => {
		// Check for potential general errors.
		if (getGeneralSimulationError(simulation))
			return setError(true)

		// Update the state.
		setHistory(history => {
			// Check if an option input is possible.
			const state = getState(history)
			const { questionId, choice, variables } = state
			if (choice !== undefined)
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
				choice: index,
			}

			// On variables, run all relevant update scripts, assuming they exist.
			if (hasVariables(simulation) && (option.updateScript || question.updateScript || simulation.updateScript)) {
				// Check said update scripts first.
				if (getScriptError(option.updateScript || question.updateScript, simulation) || getScriptError(simulation.updateScript, simulation)) {
					setError(true)
					return history
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
			return [...history.slice(0, -1), newState]
		})
	}, [simulation, setHistory, setError])

	// goToNextQuestion will go to the next question depending on the (confirmed) selected question option.
	const goToNextQuestion = useCallback(() => {
		setHistory(history => {
			// If the question has options, but no option has been selected and confirmed, we're not ready yet to move on.
			const state = getState(history)
			const { questionId, choice, variables } = state
			const question = simulation.questions[questionId]
			const options = question.options || []
			if (options.length > 0 && choice === undefined)
				throw new Error(`Invalid nextQuestion request: no option has been selected for the given state yet. Cannot go to the next question.`)

			// Determine the next question: either the follow-up for the chosen option, the follow-up for the given question, the next question in the order, or (if not existing) the end. Apply it to the new state.
			const newState = {
				questionId: (options[choice] && options[choice].followUpQuestion) || question.followUpQuestion || simulation.questionOrder[simulation.questionOrder.indexOf(question.id) + 1] || 'end',
			}

			// On variables, we should also check for events.
			if (hasVariables(simulation)) {
				// Copy necessary parameters.
				newState.variables = state.variables
				if (state.experiencedEvents)
					newState.experiencedEvents = state.experiencedEvents

				// Verify the existing events.
				if (getSimulationEventError(simulation)) {
					setError(true)
					return history
				}

				// Find all events that did not fire/trigger before, but do fire now. On multiple, select one randomly.
				const experiencedEvents = newState.experiencedEvents || []
				const variablesAsNames = switchVariableNames(variables, simulation)
				const triggeredEvents = Object.values(simulation.events).filter(event => !experiencedEvents.includes(event.id) && runCondition(variablesAsNames, event.condition))
				if (triggeredEvents.length > 0) {
					const triggeredEvent = selectRandomly(triggeredEvents)

					// Make sure that afterwards we go to the right question.
					const afterwards = triggeredEvent.afterwards || defaultAfterwards
					if (afterwards === 'originalFollowUp') {
						newState.jumpQuestionId = state.jumpQuestionId || newState.questionId // Store the original follow-up as jump-back, unless one already existed, then keep that.
					} else if (afterwards === 'eventFollowUp') {
						// Don't store any original jump-back.
					} else {
						throw new Error(`Invalid event-afterwards setting: have not implemented the setting "${afterwards}" yet.`)
					}

					// Apply the event into the state.
					newState.questionId = triggeredEvent.question || simulation.questionOrder[0]
					newState.event = triggeredEvent.id // For history display purposes.
					newState.experiencedEvents = [...experiencedEvents, triggeredEvent.id] // To prevent events from triggering multiple times.
				} else {
					// If there was a jump-back question defined, jump back to it.
					if (state.jumpQuestionId)
						newState.questionId = state.jumpQuestionId
				}
			}

			// The update is all done. Add the new state to the history.
			return [...history, newState]
		})
	}, [simulation, setHistory, setError])

	// All handlers are ready!
	return { reset, start, chooseOption, goToNextQuestion }
}
