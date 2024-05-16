import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'

import { usePrevious } from '../../../util'
import { Page } from '../../../components'
import { useSimulation, useSimulationIdFromUrl } from '../../../simulations'

import { Error } from '../../Error'

import { getInitialVariables, switchVariableNames, runUpdateScript } from '../util'

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

	// On an error or on loading, show the right notification.
	if (simulation === null)
		return <Error />
	if (simulation === undefined)
		return <Page title="Simulation laden..." />

	// We have a valid simulation! Render it! Add a key to assure a reload on a change of simulation.
	return <SimulationWithData key={simulation.id} simulation={simulation} />
}

const initialSimulationState = { questionCounter: 0 }
function SimulationWithData({ simulation }) {
	// Define the simulation state.
	const [state, setState] = useState(initialSimulationState)
	const { questionId, questionCounter } = state

	// Define handlers.
	const handlers = useSimulationHandlers(simulation, setState)
	const { start, reset, selectOption, confirmSelection, goToNextQuestion } = handlers

	// When there's no question yet, we're on the start page.
	if (!questionId)
		return <StartPage {...{ simulation, state, start }} />
	if (questionId === 'end')
		return <EndPage {...{ simulation, state, reset }} />
	return <Question key={questionCounter} {...{ simulation, state, selectOption, confirmSelection, goToNextQuestion }} />
}

// useSimulationHandlers takes a simulation and its state
function useSimulationHandlers(simulation, setState) {
	// reset will put the simulation back into its initial state with nothing defined.
	const reset = useCallback(() => {
		setState(initialSimulationState)
	}, [setState])

	// start will initialize the simulation, setting stuff like questions and variables to their (possibly partly randomized) initial values.
	const start = useCallback(() => {
		setState(state => ({
			...state,
			questionId: simulation.startingQuestion || simulation.questions[0],
			variables: getInitialVariables(simulation),
		}))
	}, [simulation, setState])

	// selectOption will select (but not confirm) an option for the current question.
	const selectOption = useCallback((index) => {
		setState(state => {
			const question = simulation.questions[state.questionId]
			const options = question.options || []
			if (index !== undefined && (index < 0 || index >= options.length))
				throw new Error(`Invalid option choice: tried to select option ${index} of a question, but the question only has ${options.length} options available. (Indices are zero-starting.)`)
			return {
				...state,
				selection: index,
			}
		})
	}, [simulation, setState])

	// confirmSelection will make a question choice definite. This will also update variables and such.
	const confirmSelection = useCallback(() => {
		setState(state => {
			// Check if a confirmation is possible.
			const { selection, confirmed, variables } = state
			if (confirmed)
				throw new Error(`Invalid selection confirmation: the selection for the current question has already been confirmed.`)
			if (selection === undefined)
				throw new Error(`Invalid selection confirmation: cannot confirm a selection if no option has been selected yet.`)

			// Extract required data.
			// const question = simulation.questions[questionId]
			// const options = question.options || []
			// const option = options[selection]

			// Run all relevant update scripts on the variables.
			let variablesAsNames = switchVariableNames(variables, simulation)
			// ToDo: run question-dependent update script.
			variablesAsNames = runUpdateScript(variablesAsNames, simulation.updateScript)

			// Save the new state with all updated data.
			return {
				...state,
				confirmed: true,
				variables: switchVariableNames(variablesAsNames, simulation, true),
			}
		})
	}, [simulation, setState])

	// goToNextQuestion will go to the next question depending on the (confirmed) selected question option.
	const goToNextQuestion = useCallback(() => {
		setState(state => {
			// If the question has options, but no option has been selected and confirmed, we're not ready yet to move on.
			const { questionId, selection, confirmed } = state
			const question = simulation.questions[questionId]
			const options = question.options || []
			if (options.length > 0 && (selection === undefined || !confirmed))
				throw new Error(`Invalid nextQuestion request: no option has been selected/confirmed for the given state yet. Cannot go to the next question.`)

			// Determine the next question: either the follow-up for the chosen option, the follow-up for the given question, the next question in the order, or (if not existing) the end.
			const nextQuestionId = (options[selection] && options[selection].followUpQuestion) || question.followUpQuestion || simulation.questionOrder[simulation.questionOrder.indexOf(question.id) + 1] || 'end'
			return {
				...state,
				questionId: nextQuestionId,
				questionCounter: state.questionCounter + 1,
				selection: undefined,
				confirmed: false,
			}
		})
	}, [simulation, setState])

	// All handlers are ready!
	return { reset, start, selectOption, confirmSelection, goToNextQuestion }
}
