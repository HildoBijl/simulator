import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { usePrevious, useLocalStorageState } from 'util'
import { Page as PageContainer } from 'components'
import { useSimulation, useSimulationIdFromUrl, useIsOwner } from 'simulations'

import { ErrorPage as GeneralErrorPage } from '../../ErrorPage'

import { getState, getSimulationError, getStateError } from '../util'

import { useSimulationActions } from './actions'
import { ErrorPage, EmptySimulation, InitializingPage, Page } from './subpages'

export function Simulation() {
	const { simulationUrl } = useParams()
	const id = useSimulationIdFromUrl(simulationUrl)
	if (id === null)
		return <GeneralErrorPage />
	if (id === undefined)
		return <PageContainer title="Simulation laden..." showLogo="right" />
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
		return <PageContainer title="Simulation laden..." showLogo="right" /> // Empty page with just a title.
	if (!simulation.pageList || simulation.pageList.length === 0)
		return <EmptySimulation {...{ simulation }} />

	// We have a valid simulation! Render it! Add a key to assure a reload of the component (including a new state) on a change of simulation.
	return <SimulationWithData key={simulation.id} simulation={simulation} />
}

function SimulationWithData({ simulation }) {
	// Define the simulation state.
	const [history, setHistory, clearHistory] = useLocalStorageState([], simulation.id)
	const [error, setError] = useState(false) // Tracks if an error was encountered during simulation run-time.
	const state = getState(history)

	// Verify the simulation has valid pages before proceeding
	useEffect(() => {
		if (simulation.pageList.length === 0) {
			console.error("Simulation has no pages");
			return;
		}

		// Check if the starting page exists
		const startingPageId = simulation.startingPage || simulation.pageList[0]?.id;
		if (!startingPageId || !simulation.pages[startingPageId]) {
			console.error("Starting page not found or invalid");
			setError(true);
		}
	}, [simulation]);

	// Check for an error in the state. (For instance an outdated pageId.)
	const stateError = useMemo(() => getStateError(simulation, state), [simulation, state])

	// Check for any errors in the simulation. (For instance a faulty update script.)
	const simulationError = useMemo(() => getSimulationError(simulation), [simulation])
	useEffect(() => { // When the simulation is OK again, go back to normal.
		if (error && !simulationError)
			setError(false)
	}, [error, simulationError])

	// Define actions.
	const actions = useSimulationActions(simulation, setHistory, clearHistory, setError)
	const { start, reset, chooseOption, goToNextPage, jumpToPage, undo } = actions

	// When there is no state yet, and we hence haven't started yet, start the simulation.
	const isOwner = useIsOwner(simulation)
	useEffect(() => {
		if (!state)
			start(isOwner)
	}, [state, start, isOwner])

	// On an error, show the error page.
	if (stateError) // Always show a state error.
		return <ErrorPage {...{ simulation, error: stateError, reset }} />
	if (simulationError && (error || isOwner)) // Only show a simulation error once we encountered it, and the error flag is set to true.
		return <ErrorPage {...{ simulation, error: simulationError, reset }} />

	// Check for special situations that require different renders.
	if (!state)
		return <InitializingPage {...{ simulation }} />

	// Render the page as normally.
	return <Page {...{ simulation, history, state, chooseOption, goToNextPage, jumpToPage, reset, undo }} />
}
