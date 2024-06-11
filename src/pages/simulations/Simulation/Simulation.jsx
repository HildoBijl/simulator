import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { usePrevious, useLocalStorageState } from 'util'
import { useUserId } from 'fb'
import { Page } from 'components'
import { useSimulation, useSimulationIdFromUrl } from 'simulations'

import { ErrorPage as GeneralErrorPage } from '../../ErrorPage'

import { getState } from '../util'
import { getSimulationError } from '../validation'

import { useSimulationActions } from './actions'
import { ErrorPage } from './subpages/ErrorPage'
import { StartPage } from './subpages/StartPage'
import { EndPage } from './subpages/EndPage'
import { Question } from './subpages/Question'

export function Simulation() {
	const { simulationUrl } = useParams()
	const id = useSimulationIdFromUrl(simulationUrl)
	if (id === null)
		return <GeneralErrorPage />
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


	// On loading or on a loading error, show the right notification.
	if (simulation === null) // Failed to load.
		return <GeneralErrorPage /> // General error page.
	if (simulation === undefined) // Loading.
		return <Page title="Simulation laden..." /> // Empty page with just a title.

	// We have a valid simulation! Render it! Add a key to assure a reload of the component (including a new state) on a change of simulation.
	return <SimulationWithData key={simulation.id} simulation={simulation} />
}

function SimulationWithData({ simulation }) {
	// Define the simulation state.
	const [history, setHistory, clearHistory] = useLocalStorageState([], simulation.id)
	const [error, setError] = useState(false) // Tracks if an error was encountered during simulation run-time.
	const state = getState(history)
	const { questionId } = state

	// Define actions.
	const actions = useSimulationActions(simulation, setHistory, clearHistory, setError)
	const { start, reset, chooseOption, goToNextQuestion } = actions

	// Check for an error in the simulation. Only display it if something actually failed. (Or directly for the owner.)
	const simulationError = useMemo(() => getSimulationError(simulation), [simulation])
	useEffect(() => { // When the simulation is OK again, go back to normal.
		if (error && !simulationError)
			setError(false)
	}, [error, simulationError])
	const userId = useUserId()
	const isOwner = simulation.owners.includes(userId)
	if (simulationError && (error || isOwner)) // Faulty simulation.
		return <ErrorPage simulation={simulation} error={simulationError} />

	// Determine whether we're at the start (no question defined), at the end, or at a regular question. Render accordingly.
	if (!questionId)
		return <StartPage {...{ simulation, state, start, setError }} />
	if (questionId === 'end')
		return <EndPage {...{ simulation, state, reset }} />
	return <Question key={history.length - 1} {...{ simulation, state, chooseOption, goToNextQuestion, setError }} />
}
