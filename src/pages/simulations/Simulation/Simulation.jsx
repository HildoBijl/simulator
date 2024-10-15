import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { usePrevious, useLocalStorageState } from 'util'
import { Page } from 'components'
import { useSimulation, useSimulationIdFromUrl, useIsOwner } from 'simulations'

import { ErrorPage as GeneralErrorPage } from '../../ErrorPage'

import { getState } from '../util'
import { getSimulationError, getStateError } from '../validation'

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
		return <Page title="Simulation laden..." showLogo="right" />
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
		return <Page title="Simulation laden..." showLogo="right" /> // Empty page with just a title.
	if (!simulation.questionList || simulation.questionList.length === 0)
		return <EmptySimulation {...{ simulation }} />

	// We have a valid simulation! Render it! Add a key to assure a reload of the component (including a new state) on a change of simulation.
	return <SimulationWithData key={simulation.id} simulation={simulation} />
}

function SimulationWithData({ simulation }) {
	// Define the simulation state.
	const [history, setHistory, clearHistory] = useLocalStorageState([], simulation.id)
	const [error, setError] = useState(false) // Tracks if an error was encountered during simulation run-time.
	const state = getState(history)
	const { questionId } = state

	// Check for any errors in the simulation. (For instance a faulty update script.)
	const simulationError = useMemo(() => getSimulationError(simulation), [simulation])
	useEffect(() => { // When the simulation is OK again, go back to normal.
		if (error && !simulationError)
			setError(false)
	}, [error, simulationError])

	// Check for an error in the state. (For instance an outdated question ID.)
	const stateError = useMemo(() => getStateError(simulation, state), [simulation, state])

	// Define actions.
	const actions = useSimulationActions(simulation, setHistory, clearHistory, setError)
	const { start, reset, chooseOption, goToNextQuestion, jumpToQuestion, undo } = actions

	// On an error, show the error page.
	const isOwner = useIsOwner(simulation)
	if (simulationError && (error || isOwner)) // Only show a simulation error once we encountered it, and the error flag is set to true.
		return <ErrorPage {...{ simulation, error: simulationError, reset }} />
	if (stateError) // Always show a state error.
		return <ErrorPage {...{ simulation, error: stateError, reset }} />

	// Determine whether we're at the start (no question defined), at the end, or at a regular question. Render accordingly.
	if (!questionId || questionId === 'start')
		return <StartPage {...{ simulation, start }} />
	if (questionId === 'end')
		return <EndPage {...{ simulation, history, reset }} />
	return <Question key={history.length - 1} {...{ simulation, state, chooseOption, goToNextQuestion, jumpToQuestion, reset, undo }} />
}

function EmptySimulation({ simulation }) {
	const isOwner = useIsOwner(simulation)
	return <Page title={simulation.title || 'Leere Simulation'} showLogo="right">
		{isOwner ?
			<p>Sie haben noch keine Seiten zu dieser Simulation hinzugefügt. Fügen Sie eine Seite hinzu, um zu beginnen.</p> :
			<p>Der Ersteller der Simulation hat noch keine Seiten zu dieser Simulation hinzugefügt. Ohne Seiten kann nichts angezeigt werden.</p>}
	</Page>
}
