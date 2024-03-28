import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { usePrevious } from '../../../util'
import { Page } from '../../../components'
import { useSimulation, useSimulationIdFromUrl } from '../../../simulations'

import { Error } from '../../Error'

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

function SimulationWithData({ simulation }) {
	// Define the simulation state.
	const [question, setQuestion] = useState()

	// When there's no question yet, we're on the start page.
	if (!question)
		return <StartPage simulation={simulation} start={() => setQuestion(simulation.startingQuestion || simulation.questions[0])} />
	if (question === 'end')
		return <EndPage simulation={simulation} reset={() => setQuestion(undefined)} />
	return <Question simulation={simulation} question={simulation.questions[question]} goToQuestion={(questionId) => setQuestion(questionId)} />
}
